// Event-driven order-status pipeline simulation.
//
// Pure, deterministic (seeded) and DOM-free so it can be unit tested and stepped
// from a requestAnimationFrame loop. Models a Kafka/RocketMQ-style setup:
//
//   order service ──(status events, keyed by orderId)──▶ topic [P partitions]
//        ──▶ consumer group (each partition fetched by one member per generation)
//        ──▶ read model (latest status per order)
//
// What it demonstrates:
//   - Per-key ordering: same orderId -> same partition -> processed in offset order.
//   - Blocking retries with exponential backoff (head-of-line blocking keeps order),
//     then a dead-letter queue after maxAttempts failed attempts.
//   - Eager rebalancing: on join/leave every partition is reassigned, fetching
//     pauses, and the group moves to a new generation. In-flight work from the old
//     generation still finishes, but its offset commit is rejected, so the message
//     is redelivered to the new owner.
//   - At-least-once delivery: producer re-sends, a consumer crashing after applying
//     a message but before committing it, and rejected commits all cause
//     redelivery. Consumers dedupe by eventId (idempotency key), so the read model
//     never applies an event twice.

export const STATUSES = ["CREATED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

export const DEFAULT_CONFIG = {
  partitions: 4,
  consumers: 3,
  ratePerSec: 6, // status events produced per second
  failureRate: 0.05, // probability a processing attempt fails
  duplicateRate: 0.03, // probability the producer re-sends an event (at-least-once)
  crashAfterApplyRate: 0.5, // probability a killed consumer had applied its in-flight event but not committed it
  maxAttempts: 4, // failed attempts before an event is dead-lettered
  backoffBaseMs: 200, // retry backoff = base * 2^(failures-1)
  processMinMs: 80,
  processMaxMs: 200,
  rebalanceMs: 400,
  latencyWindow: 300, // completions kept for percentile metrics
  throughputWindowMs: 3000,
};

const MAX_TICK_MS = 20;

// Small, fast, seedable PRNG (mulberry32).
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stable string hash (FNV-1a) used as the partitioner.
export function partitionFor(key, partitions) {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % partitions;
}

export function createSim(config = {}, seed = 42) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const sim = {
    cfg,
    rng: mulberry32(seed),
    now: 0,
    produceAcc: 0,
    nextEventId: 1,
    nextOrderId: 1,
    nextConsumerId: 1,
    logSeq: 0,
    generation: 0,
    activeOrders: [], // producer side: { orderId, next } where next = index of next status to emit
    partitions: Array.from({ length: cfg.partitions }, (_, id) => ({ id, queue: [], lockedBy: null, nextOffset: 0 })),
    consumers: [],
    rebalanceUntil: 0,
    lastRebalanceAt: 0,
    processedIds: new Set(),
    readModel: new Map(), // orderId -> { status, version, updatedAt }
    processedLog: new Map(), // orderId -> versions in the order they were processed (verifies ordering)
    dlq: [],
    latencies: [],
    completions: [], // timestamps of successful first-time processing (throughput window)
    stats: {
      produced: 0,
      duplicatesSent: 0,
      applied: 0,
      deduped: 0,
      outOfOrder: 0,
      committed: 0,
      commitsRejected: 0,
      retries: 0,
      dlq: 0,
      redelivered: 0,
      rebalances: 0,
    },
    log: [], // recent human-readable events for the UI
  };
  for (let i = 0; i < cfg.consumers; i++) addConsumer(sim, { silent: true });
  rebalance(sim, { pause: false });
  return sim;
}

function pushLog(sim, kind, text) {
  sim.log.push({ seq: sim.logSeq++, t: sim.now, kind, text });
  if (sim.log.length > 30) sim.log.shift();
}

function rand(sim, min, max) {
  return min + sim.rng() * (max - min);
}

function enqueue(sim, event) {
  const p = sim.partitions[partitionFor(event.orderId, sim.cfg.partitions)];
  // Each record gets its own offset, even when the producer re-sends the same eventId.
  p.queue.push({ ...event, offset: p.nextOffset++, failures: 0, readyAt: sim.now });
}

// Emit one status event. Mixes new orders with lifecycle progress of existing ones.
export function produceOne(sim) {
  const { activeOrders } = sim;
  let order;
  if (activeOrders.length === 0 || (activeOrders.length < 12 && sim.rng() < 0.35)) {
    order = { orderId: `ORD-${String(sim.nextOrderId++).padStart(4, "0")}`, next: 0 };
    activeOrders.push(order);
  } else {
    order = activeOrders[Math.floor(sim.rng() * activeOrders.length)];
  }
  const version = order.next;
  const event = {
    eventId: sim.nextEventId++,
    orderId: order.orderId,
    status: STATUSES[version],
    version,
    producedAt: sim.now,
  };
  order.next++;
  if (order.next >= STATUSES.length) sim.activeOrders = activeOrders.filter((o) => o !== order);

  enqueue(sim, event);
  sim.stats.produced++;

  // At-least-once producer: sometimes the same event is sent twice.
  if (sim.rng() < sim.cfg.duplicateRate) {
    enqueue(sim, event);
    sim.stats.duplicatesSent++;
  }
  return event;
}

export function spike(sim, n = 40) {
  for (let i = 0; i < n; i++) produceOne(sim);
  pushLog(sim, "info", `Traffic spike: ${n} events published`);
}

export function addConsumer(sim, { silent = false } = {}) {
  const c = { id: `C${sim.nextConsumerId++}`, alive: true, partitions: [], busy: null, cursor: 0, processed: 0 };
  sim.consumers.push(c);
  if (!silent) {
    pushLog(sim, "info", `${c.id} joined the group`);
    rebalance(sim);
  }
  return c;
}

export function killConsumer(sim, id) {
  const c = sim.consumers.find((x) => x.id === id && x.alive);
  if (!c) return false;
  c.alive = false;
  if (c.busy) {
    const { event, partition } = c.busy;
    // The offset was never committed, so the message stays at the head of its
    // partition and is redelivered. Sometimes the crash happens *after* the side
    // effect was applied — the redelivery is then caught by the idempotency check.
    if (sim.rng() < sim.cfg.crashAfterApplyRate) {
      processOnce(sim, event);
      pushLog(sim, "bad", `${c.id} crashed after applying ${event.orderId} ${event.status} but before committing`);
    } else {
      pushLog(sim, "bad", `${c.id} crashed while processing ${event.orderId} ${event.status}`);
    }
    sim.partitions[partition].lockedBy = null;
    c.busy = null;
    sim.stats.redelivered++;
  } else {
    pushLog(sim, "bad", `${c.id} crashed`);
  }
  c.partitions = [];
  sim.consumers = sim.consumers.filter((x) => x !== c);
  rebalance(sim);
  return true;
}

// Eager rebalance: every partition is reassigned round-robin and the group moves
// to a new generation. Fetching pauses for `rebalanceMs`.
export function rebalance(sim, { pause = true } = {}) {
  const alive = sim.consumers.filter((c) => c.alive);
  alive.forEach((c) => (c.partitions = []));
  if (alive.length > 0) {
    sim.partitions.forEach((p, i) => alive[i % alive.length].partitions.push(p.id));
  }
  sim.generation++;
  if (pause) {
    sim.rebalanceUntil = sim.now + sim.cfg.rebalanceMs;
    sim.lastRebalanceAt = sim.now;
    sim.stats.rebalances++;
    pushLog(
      sim,
      "warn",
      alive.length
        ? `Rebalance (generation ${sim.generation}): ${sim.partitions.length} partitions across ${alive.length} consumer(s)`
        : "No live consumers — lag will grow",
    );
  }
}

export function setConfig(sim, patch) {
  Object.assign(sim.cfg, patch);
}

function ownerOf(sim, partitionId) {
  return sim.consumers.find((c) => c.alive && c.partitions.includes(partitionId));
}

function startNext(sim, c) {
  const n = c.partitions.length;
  for (let k = 0; k < n; k++) {
    const pid = c.partitions[(c.cursor + k) % n];
    const p = sim.partitions[pid];
    const head = p.queue[0];
    if (!head || p.lockedBy || head.readyAt > sim.now) continue;
    p.lockedBy = c.id;
    c.busy = {
      partition: pid,
      event: head,
      generation: sim.generation,
      startedAt: sim.now,
      doneAt: sim.now + rand(sim, sim.cfg.processMinMs, sim.cfg.processMaxMs),
    };
    c.cursor = (c.cursor + k + 1) % n;
    return;
  }
}

// Apply an event's side effect exactly once (idempotency key = eventId).
function processOnce(sim, event) {
  if (sim.processedIds.has(event.eventId)) {
    sim.stats.deduped++;
    pushLog(sim, "info", `Event #${event.eventId} already applied — redelivery ignored (idempotency key)`);
    return false;
  }
  sim.processedIds.add(event.eventId);

  const versions = sim.processedLog.get(event.orderId) ?? [];
  versions.push(event.version);
  sim.processedLog.set(event.orderId, versions);

  const current = sim.readModel.get(event.orderId);
  if (current && current.version >= event.version) {
    // An older status after a newer one would be an ordering bug; the version guard
    // keeps the read model from regressing, and the counter makes it visible.
    sim.stats.outOfOrder++;
  } else {
    sim.readModel.set(event.orderId, { status: event.status, version: event.version, updatedAt: sim.now });
    sim.stats.applied++;
  }

  sim.latencies.push(sim.now - event.producedAt);
  if (sim.latencies.length > sim.cfg.latencyWindow) sim.latencies.shift();
  sim.completions.push(sim.now);
  return true;
}

function complete(sim, c) {
  const { partition, event, generation } = c.busy;
  const p = sim.partitions[partition];
  c.busy = null;
  p.lockedBy = null;

  if (sim.rng() < sim.cfg.failureRate) {
    event.failures++;
    if (event.failures >= sim.cfg.maxAttempts) {
      p.queue.shift();
      sim.dlq.push({ ...event, failedAt: sim.now });
      if (sim.dlq.length > 50) sim.dlq.shift();
      sim.stats.dlq++;
      pushLog(sim, "bad", `${event.orderId} ${event.status} → DLQ after ${event.failures} failed attempts`);
    } else {
      // Blocking retry: keep the event at the head so per-key order is preserved.
      event.readyAt = sim.now + sim.cfg.backoffBaseMs * 2 ** (event.failures - 1);
      sim.stats.retries++;
      pushLog(sim, "warn", `${event.orderId} ${event.status} failed (attempt ${event.failures}) — retry in ${Math.round(event.readyAt - sim.now)}ms`);
    }
    return;
  }

  processOnce(sim, event);
  c.processed++;

  if (generation !== sim.generation) {
    // Commit from a previous generation is rejected (the group rebalanced while this
    // was in flight). The offset stays put and the new owner gets it again.
    sim.stats.commitsRejected++;
    sim.stats.redelivered++;
    pushLog(sim, "warn", `${c.id}: commit for ${event.orderId} rejected after rebalance — will be redelivered`);
    return;
  }
  p.queue.shift(); // commit offset
  sim.stats.committed++;
}

function tick(sim, dt) {
  sim.now += dt;

  sim.produceAcc += (sim.cfg.ratePerSec * dt) / 1000;
  while (sim.produceAcc >= 1) {
    produceOne(sim);
    sim.produceAcc -= 1;
  }

  const rebalancing = sim.now < sim.rebalanceUntil;
  for (const c of sim.consumers) {
    if (!c.alive) continue;
    if (c.busy && sim.now >= c.busy.doneAt) complete(sim, c);
    if (!c.busy && !rebalancing) startNext(sim, c);
  }
}

export function step(sim, ms) {
  let remaining = ms;
  while (remaining > 0) {
    const dt = Math.min(MAX_TICK_MS, remaining);
    tick(sim, dt);
    remaining -= dt;
  }
  const cutoff = sim.now - sim.cfg.throughputWindowMs;
  while (sim.completions.length && sim.completions[0] < cutoff) sim.completions.shift();
  return sim;
}

function percentile(sorted, q) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

// Plain, render-friendly view of the simulation.
export function snapshot(sim) {
  const sorted = [...sim.latencies].sort((a, b) => a - b);
  const window = Math.min(sim.now, sim.cfg.throughputWindowMs) / 1000;
  const recentOrders = [...sim.readModel.entries()]
    .sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    .slice(0, 6)
    .map(([orderId, v]) => ({ orderId, ...v }));
  return {
    now: sim.now,
    generation: sim.generation,
    rebalancing: sim.now < sim.rebalanceUntil,
    partitions: sim.partitions.map((p) => {
      const owner = ownerOf(sim, p.id);
      const head = p.queue[0];
      return {
        id: p.id,
        depth: p.queue.length,
        owner: owner?.id ?? null,
        blocked: Boolean(head && head.failures > 0 && head.readyAt > sim.now),
        head: head ? { orderId: head.orderId, status: head.status, failures: head.failures } : null,
        preview: p.queue.slice(0, 10).map((e) => ({ offset: e.offset, eventId: e.eventId, status: e.status, retrying: e.failures > 0 })),
      };
    }),
    consumers: sim.consumers.map((c) => ({
      id: c.id,
      alive: c.alive,
      partitions: [...c.partitions],
      processed: c.processed,
      busy: c.busy ? { orderId: c.busy.event.orderId, status: c.busy.event.status, partition: c.busy.partition } : null,
    })),
    metrics: {
      throughput: window > 0 ? sim.completions.length / window : 0,
      p50: percentile(sorted, 0.5),
      p99: percentile(sorted, 0.99),
      lag: sim.partitions.reduce((n, p) => n + p.queue.length, 0),
      ...sim.stats,
    },
    dlq: sim.dlq.slice(-5).reverse(),
    recentOrders,
    log: sim.log.slice(-8).reverse(),
  };
}
