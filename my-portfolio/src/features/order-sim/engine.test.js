import { describe, expect, it } from "vitest";
import {
  addConsumer,
  createSim,
  killConsumer,
  partitionFor,
  produceOne,
  snapshot,
  spike,
  step,
} from "./engine.js";

const quiet = { failureRate: 0, duplicateRate: 0 };

function pending(sim) {
  return sim.partitions.reduce((n, p) => n + p.queue.length, 0);
}

// Step in small increments, calling `check` after every increment.
function stepChecked(sim, ms, check, inc = 10) {
  for (let t = 0; t < ms; t += inc) {
    step(sim, inc);
    check(sim);
  }
}

describe("partitioner", () => {
  it("spreads keys across partitions deterministically", () => {
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) counts[partitionFor(`ORD-${String(i).padStart(4, "0")}`, 4)]++;
    for (const n of counts) expect(n).toBeGreaterThan(700); // roughly uniform (ideal 1000)
    expect(partitionFor("ORD-0042", 4)).toBe(partitionFor("ORD-0042", 4));
  });

  it("sends every event of an order to one partition", () => {
    const sim = createSim({ ...quiet, ratePerSec: 0 });
    for (let i = 0; i < 60; i++) produceOne(sim);
    const homes = new Map();
    for (const p of sim.partitions) {
      for (const e of p.queue) {
        if (!homes.has(e.orderId)) homes.set(e.orderId, new Set());
        homes.get(e.orderId).add(p.id);
      }
    }
    for (const parts of homes.values()) expect(parts.size).toBe(1);
  });

  it("gives every record a unique, increasing offset within its partition", () => {
    const sim = createSim({ ratePerSec: 0, duplicateRate: 1 });
    for (let i = 0; i < 30; i++) produceOne(sim);
    for (const p of sim.partitions) {
      p.queue.forEach((e, i) => i > 0 && expect(e.offset).toBe(p.queue[i - 1].offset + 1));
    }
  });
});

describe("ordering", () => {
  it("processes each order's statuses strictly in produce order", () => {
    const sim = createSim({ ...quiet, ratePerSec: 20 });
    step(sim, 30_000);
    expect(sim.stats.applied).toBeGreaterThan(100);
    for (const versions of sim.processedLog.values()) {
      versions.forEach((v, i) => i > 0 && expect(v).toBe(versions[i - 1] + 1));
    }
  });

  it("keeps per-key order under failures, duplicates, crashes and rebalances", () => {
    const sim = createSim({ ratePerSec: 15, failureRate: 0.2, duplicateRate: 0.1 }, 7);
    step(sim, 5_000);
    killConsumer(sim, sim.consumers[0].id);
    step(sim, 5_000);
    addConsumer(sim);
    spike(sim, 50);
    step(sim, 20_000);
    expect(sim.stats.retries).toBeGreaterThan(0);
    expect(sim.stats.outOfOrder).toBe(0);
    for (const versions of sim.processedLog.values()) {
      versions.forEach((v, i) => i > 0 && expect(v).toBeGreaterThan(versions[i - 1]));
    }
  });
});

describe("consumer group", () => {
  it("assigns every partition to exactly one live consumer after a crash", () => {
    const sim = createSim({ ...quiet, partitions: 4, consumers: 3 });
    step(sim, 1_000);
    const victim = sim.consumers[1].id;
    expect(killConsumer(sim, victim)).toBe(true);

    expect(sim.consumers.map((c) => c.id)).not.toContain(victim);
    const owned = sim.consumers.flatMap((c) => c.partitions).sort();
    expect(owned).toEqual([0, 1, 2, 3]);
  });

  it("only ever starts work on partitions a consumer owns, one consumer per partition", () => {
    const sim = createSim({ ratePerSec: 25, failureRate: 0.1, duplicateRate: 0.05 }, 11);
    const seenStarts = new Set();
    const check = (s) => {
      const busyByPartition = new Map();
      for (const c of s.consumers) {
        if (!c.busy) continue;
        // At most one consumer working on a partition at any time.
        expect(busyByPartition.has(c.busy.partition)).toBe(false);
        busyByPartition.set(c.busy.partition, c.id);
        // Work started in the current generation must be on an owned partition.
        if (c.busy.generation === s.generation) expect(c.partitions).toContain(c.busy.partition);
        seenStarts.add(c.busy.startedAt);
      }
    };
    stepChecked(sim, 4_000, check);
    killConsumer(sim, sim.consumers[0].id);
    stepChecked(sim, 4_000, check);
    addConsumer(sim);
    addConsumer(sim);
    stepChecked(sim, 4_000, check);
    expect(seenStarts.size).toBeGreaterThan(50);
  });

  it("pauses fetching during the rebalance window", () => {
    const sim = createSim({ ...quiet, ratePerSec: 0, rebalanceMs: 500 });
    spike(sim, 20);
    addConsumer(sim); // triggers a rebalance
    const before = sim.stats.committed;
    step(sim, 400);
    expect(sim.stats.committed).toBe(before);
    step(sim, 2_000);
    expect(sim.stats.committed).toBeGreaterThan(before);
  });

  it("rejects commits from the previous generation and redelivers the message", () => {
    const sim = createSim({ ...quiet, ratePerSec: 0, consumers: 2, processMinMs: 300, processMaxMs: 300, rebalanceMs: 100 });
    spike(sim, 1);
    step(sim, 20); // in flight
    expect(sim.consumers.some((c) => c.busy)).toBe(true);
    addConsumer(sim); // new generation while the event is in flight
    step(sim, 2_000);
    expect(sim.stats.commitsRejected).toBe(1);
    expect(sim.stats.applied).toBe(1); // applied once…
    expect(sim.stats.deduped).toBe(1); // …and the redelivery was ignored
    expect(pending(sim)).toBe(0);
  });

  it("redelivers a crashed consumer's in-flight message without counting a failed attempt", () => {
    const sim = createSim({ ...quiet, ratePerSec: 0, consumers: 1, processMinMs: 1000, processMaxMs: 1000, crashAfterApplyRate: 0 });
    spike(sim, 1);
    step(sim, 100);
    expect(sim.consumers[0].busy).not.toBeNull();
    killConsumer(sim, sim.consumers[0].id);
    expect(pending(sim)).toBe(1); // not lost
    expect(sim.partitions.find((p) => p.queue.length).queue[0].failures).toBe(0);
    expect(snapshot(sim).partitions.some((p) => p.preview.some((e) => e.retrying))).toBe(false);
    addConsumer(sim);
    step(sim, 3_000);
    expect(sim.stats.applied).toBe(1);
    expect(sim.stats.deduped).toBe(0);
    expect(sim.stats.redelivered).toBe(1);
  });

  it("dedupes the redelivery when a consumer crashed after applying but before committing", () => {
    const sim = createSim({ ...quiet, ratePerSec: 0, consumers: 1, processMinMs: 1000, processMaxMs: 1000, crashAfterApplyRate: 1 });
    spike(sim, 1);
    step(sim, 100);
    killConsumer(sim, sim.consumers[0].id);
    expect(sim.stats.applied).toBe(1); // side effect happened before the crash
    addConsumer(sim);
    step(sim, 3_000);
    expect(sim.stats.applied).toBe(1); // never applied twice
    expect(sim.stats.deduped).toBe(1);
    expect(pending(sim)).toBe(0);
  });

  it("builds lag when no consumers are alive", () => {
    const sim = createSim({ ...quiet, ratePerSec: 10, consumers: 1 });
    killConsumer(sim, sim.consumers[0].id);
    step(sim, 3_000);
    expect(snapshot(sim).metrics.lag).toBeGreaterThanOrEqual(29);
  });
});

describe("retries and dead-lettering", () => {
  it("dead-letters an event after maxAttempts failed attempts", () => {
    const sim = createSim({ ratePerSec: 0, failureRate: 1, duplicateRate: 0, maxAttempts: 3, consumers: 1 });
    spike(sim, 1);
    step(sim, 10_000);
    expect(sim.stats.dlq).toBe(1);
    expect(sim.stats.retries).toBe(2);
    expect(sim.dlq[0].failures).toBe(3);
    expect(pending(sim)).toBe(0);
  });

  it("backs off exponentially: base * 2^(n-1) between attempts", () => {
    const sim = createSim({ ratePerSec: 0, failureRate: 1, duplicateRate: 0, maxAttempts: 5, backoffBaseMs: 100, processMinMs: 10, processMaxMs: 10, consumers: 1 });
    spike(sim, 1);
    const starts = [];
    let busy = false;
    for (let t = 0; t < 5_000; t += 5) {
      step(sim, 5);
      const nowBusy = Boolean(sim.consumers[0].busy);
      if (nowBusy && !busy) starts.push(sim.now);
      busy = nowBusy;
    }
    expect(starts).toHaveLength(5);
    const gaps = starts.slice(1).map((t, i) => t - starts[i]);
    // gap = processing (10ms) + backoff (100, 200, 400, 800), within one 5ms step
    [110, 210, 410, 810].forEach((expected, i) => expect(Math.abs(gaps[i] - expected)).toBeLessThanOrEqual(5));
  });

  it("only marks an event as retrying after it has actually failed", () => {
    const sim = createSim({ ...quiet, ratePerSec: 8 });
    for (let i = 0; i < 200; i++) {
      step(sim, 50);
      for (const p of snapshot(sim).partitions) expect(p.preview.some((e) => e.retrying)).toBe(false);
    }
  });
});

describe("idempotency", () => {
  it("ignores producer re-sends of the same event", () => {
    const sim = createSim({ ratePerSec: 10, failureRate: 0, duplicateRate: 1 });
    step(sim, 10_000);
    sim.cfg.ratePerSec = 0;
    step(sim, 10_000); // drain
    expect(sim.stats.duplicatesSent).toBe(sim.stats.produced);
    expect(sim.stats.deduped).toBe(sim.stats.duplicatesSent);
    expect(sim.stats.applied).toBe(sim.stats.produced);
  });
});

describe("conservation and determinism", () => {
  it("never loses a record: every one is committed, dead-lettered or still pending", () => {
    const sim = createSim({ ratePerSec: 12, failureRate: 0.15, duplicateRate: 0.05 }, 3);
    step(sim, 8_000);
    killConsumer(sim, sim.consumers[0].id);
    step(sim, 4_000);
    addConsumer(sim);
    step(sim, 4_000);
    const delivered = sim.stats.produced + sim.stats.duplicatesSent;
    expect(sim.stats.committed + sim.stats.dlq + pending(sim)).toBe(delivered);
  });

  it("is deterministic for a given seed", () => {
    const run = () => {
      const sim = createSim({ ratePerSec: 9, failureRate: 0.1 }, 123);
      step(sim, 5_000);
      killConsumer(sim, sim.consumers[2].id);
      step(sim, 5_000);
      return snapshot(sim);
    };
    expect(run()).toEqual(run());
  });

  it("gives log entries unique keys even for identical messages at the same time", () => {
    const sim = createSim({ ...quiet, ratePerSec: 0 });
    spike(sim, 1);
    spike(sim, 1);
    const seqs = snapshot(sim).log.map((l) => l.seq);
    expect(new Set(seqs).size).toBe(seqs.length);
  });
});
