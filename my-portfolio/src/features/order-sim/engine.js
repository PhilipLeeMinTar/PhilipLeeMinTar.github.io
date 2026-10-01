// Event-driven order-status pipeline simulation.
//
// Pure, deterministic (seeded) and DOM-free so it can be unit tested and stepped
// from a requestAnimationFrame loop. Models a Kafka/RocketMQ-style setup:
//
//   order service ──(status events, keyed by orderId)──▶ topic [P partitions]
//        ──▶ consumer group (each partition owned by exactly one consumer)
//        ──▶ read model (latest status per order)
//
// Guarantees it demonstrates:
//   - Per-key ordering: same orderId -> same partition -> processed in order.
//   - At-least-once delivery: the producer occasionally re-sends an event and a
//     consumer killed mid-flight leaves its message uncommitted for redelivery;
//     consumers dedupe by eventId (idempotency key).
//   - Retries with exponential backoff that block the partition (preserving
//     order), then a dead-letter queue after maxAttempts.
//   - Rebalancing: partitions are reassigned round-robin across live consumers,
//     with a short stop-the-world pause.

export const STATUSES = ["CREATED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];

export const DEFAULT_CONFIG = {
  partitions: 4,
  consumers: 3,
  ratePerSec: 6, // status events produced per second
  failureRate: 0.05, // probability a processing attempt fails
  duplicateRate: 0.03, // probability the producer re-sends an event (at-least-once)
  maxAttempts: 4, // attempts before an event is dead-lettered
  backoffBaseMs: 200, // retry backoff = base * 2^(attempt-1)
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
    activeOrders: [], // producer side: { orderId, next } where next = index of next status to emit
    partitions: Array.from({ length: cfg.partitions }, (_, id) => ({ id, queue: [], lockedBy: null })),
    consumers: [],
    rebalanceUntil: 0,
    processedIds: new Set(),
    readModel: new Map(), // orderId -> { status, version, updatedAt }
    appliedLog: new Map(), // orderId -> [versions applied, in order] (used to verify ordering)
    dlq: [],
    latencies: [],
    completions: [], // timestamps of successful completions (throughput window)
    stats: { produced: 0, duplicatesSent: 0, applied: 0, deduped: 0, outOfOrder: 0, retries: 0, dlq: 0, redelivered: 0, rebalances: 0 },
    log: [], // recent human-readable events for the UI
  };
  for (let i = 0; i < cfg.consumers; i++) addConsumer(sim, { silent: true });
  rebalance(sim, { pause: false });
  return sim;
}

function pushLog(sim, kind, text) {
  sim.log.push({ t: sim.now, kind, text });
  if (sim.log.length > 30) sim.log.shift();
}

function rand(sim, min, max) {
  return min + sim.rng() * (max - min);
}

function enqueue(sim, event) {
  const p = sim.partitions[partitionFor(event.orderId, sim.cfg.partitions)];
  p.queue.push(event);
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
    attempts: 0,
    readyAt: sim.now,
  };
  order.next++;
  if (order.next >= STATUSES.length) sim.activeOrders = activeOrders.filter((o) => o !== order);

  enqueue(sim, event);
  sim.stats.produced++;

  // At-least-once producer: sometimes the same event is sent twice.
  if (sim.rng() < sim.cfg.duplicateRate) {
    enqueue(sim, { ...event, attempts: 0 });
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
    // Offset was never committed: the message stays at the head of its partition
    // and will be redelivered to the partition's next owner.
    sim.partitions[c.busy.partition].lockedBy = null;
    c.busy = null;
    sim.stats.redelivered++;
  }
  c.partitions = [];
  sim.consumers = sim.consumers.filter((x) => x !== c);
  pushLog(sim, "bad", `${c.id} crashed — its partitions will be reassigned`);
  rebalance(sim);
  return true;
}

export function rebalance(sim, { pause = true } = {}) {
  const alive = sim.consumers.filter((c) => c.alive);
  alive.forEach((c) => (c.partitions = []));
  if (alive.length > 0) {
    sim.partitions.forEach((p, i) => alive[i % alive.length].partitions.push(p.id));
  }
  if (pause) {
    sim.rebalanceUntil = sim.now + sim.cfg.rebalanceMs;
    sim.stats.rebalances++;
    pushLog(sim, "warn", alive.length ? `Rebalanced ${sim.partitions.length} partitions across ${alive.length} consumer(s)` : "No live consumers — lag will grow");
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
    head.attempts++;
    c.busy = { partition: pid, event: head, doneAt: sim.now + rand(sim, sim.cfg.processMinMs, sim.cfg.processMaxMs) };
    c.cursor = (c.cursor + k + 1) % n;
    return;
  }
}

function complete(sim, c) {
  const { partition, event } = c.busy;
  const p = sim.partitions[partition];
  c.busy = null;
  p.lockedBy = null;

  if (sim.rng() < sim.cfg.failureRate) {
    if (event.attempts >= sim.cfg.maxAttempts) {
      p.queue.shift();
      sim.dlq.push({ ...event, failedAt: sim.now });
      if (sim.dlq.length > 50) sim.dlq.shift();
      sim.stats.dlq++;
      pushLog(sim, "bad", `${event.orderId} ${event.status} → DLQ after ${event.attempts} attempts`);
    } else {
      // Blocking retry: keep the event at the head so per-key order is preserved.
      event.readyAt = sim.now + sim.cfg.backoffBaseMs * 2 ** (event.attempts - 1);
      sim.stats.retries++;
      pushLog(sim, "warn", `${event.orderId} ${event.status} failed (attempt ${event.attempts}) — retry in ${Math.round(event.readyAt - sim.now)}ms`);
    }
    return;
  }

  p.queue.shift(); // commit offset
  c.processed++;

  if (sim.processedIds.has(event.eventId)) {
    sim.stats.deduped++;
    pushLog(sim, "info", `Duplicate event #${event.eventId} ignored (idempotency key)`);
    return;
  }
  sim.processedIds.add(event.eventId);

  const current = sim.readModel.get(event.orderId);
  if (current && current.version >= event.version) {
    // An older status after a newer one would be an ordering bug; the version guard
    // keeps the read model from regressing, and the counter makes it visible.
    sim.stats.outOfOrder++;
  } else {
    sim.readModel.set(event.orderId, { status: event.status, version: event.version, updatedAt: sim.now });
    const applied = sim.appliedLog.get(event.orderId) ?? [];
    applied.push(event.version);
    sim.appliedLog.set(event.orderId, applied);
    sim.stats.applied++;
  }

  sim.latencies.push(sim.now - event.producedAt);
  if (sim.latencies.length > sim.cfg.latencyWindow) sim.latencies.shift();
  sim.completions.push(sim.now);
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
    rebalancing: sim.now < sim.rebalanceUntil,
    partitions: sim.partitions.map((p) => {
      const owner = ownerOf(sim, p.id);
      const head = p.queue[0];
      return {
        id: p.id,
        depth: p.queue.length,
        owner: owner?.id ?? null,
        blocked: Boolean(head && head.attempts > 0 && head.readyAt > sim.now),
        head: head ? { orderId: head.orderId, status: head.status, attempts: head.attempts } : null,
        preview: p.queue.slice(0, 10).map((e) => ({ eventId: e.eventId, status: e.status, attempts: e.attempts })),
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
