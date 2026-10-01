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

describe("partitioner", () => {
  it("routes the same key to the same partition", () => {
    for (const key of ["ORD-0001", "ORD-0042", "ORD-9999"]) {
      expect(partitionFor(key, 4)).toBe(partitionFor(key, 4));
      expect(partitionFor(key, 4)).toBeGreaterThanOrEqual(0);
      expect(partitionFor(key, 4)).toBeLessThan(4);
    }
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
});

describe("ordering", () => {
  it("applies each order's statuses strictly in order", () => {
    const sim = createSim({ ...quiet, ratePerSec: 20 });
    step(sim, 30_000);
    expect(sim.stats.applied).toBeGreaterThan(100);
    for (const versions of sim.appliedLog.values()) {
      versions.forEach((v, i) => i > 0 && expect(v).toBeGreaterThan(versions[i - 1]));
    }
    expect(sim.stats.outOfOrder).toBe(0);
  });

  it("keeps per-key order under failures, duplicates and consumer crashes", () => {
    const sim = createSim({ ratePerSec: 15, failureRate: 0.2, duplicateRate: 0.1 }, 7);
    step(sim, 5_000);
    killConsumer(sim, sim.consumers[0].id);
    step(sim, 5_000);
    addConsumer(sim);
    spike(sim, 50);
    step(sim, 20_000);
    expect(sim.stats.retries).toBeGreaterThan(0);
    expect(sim.stats.outOfOrder).toBe(0);
  });
});

describe("rebalancing", () => {
  it("reassigns every partition to exactly one live consumer after a crash", () => {
    const sim = createSim({ ...quiet, partitions: 4, consumers: 3 });
    step(sim, 1_000);
    const victim = sim.consumers[1].id;
    expect(killConsumer(sim, victim)).toBe(true);

    expect(sim.consumers.map((c) => c.id)).not.toContain(victim);
    const owned = sim.consumers.flatMap((c) => c.partitions).sort();
    expect(owned).toEqual([0, 1, 2, 3]);
  });

  it("pauses consumption during the rebalance window", () => {
    const sim = createSim({ ...quiet, ratePerSec: 0, rebalanceMs: 500 });
    spike(sim, 20);
    addConsumer(sim); // triggers a rebalance
    const before = sim.stats.applied;
    step(sim, 400);
    expect(sim.stats.applied).toBe(before);
    step(sim, 2_000);
    expect(sim.stats.applied).toBeGreaterThan(before);
  });

  it("redelivers the in-flight message of a crashed consumer", () => {
    const sim = createSim({ ...quiet, ratePerSec: 0, consumers: 1, processMinMs: 1000, processMaxMs: 1000 });
    spike(sim, 1);
    step(sim, 100); // consumer picks up the event and is mid-flight
    expect(sim.consumers[0].busy).not.toBeNull();
    killConsumer(sim, sim.consumers[0].id);
    expect(pending(sim)).toBe(1); // not lost
    addConsumer(sim);
    step(sim, 3_000);
    expect(sim.stats.applied).toBe(1);
    expect(sim.stats.redelivered).toBe(1);
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
    expect(sim.dlq[0].attempts).toBe(3);
    expect(pending(sim)).toBe(0);
  });

  it("backs off exponentially between attempts", () => {
    const sim = createSim({ ratePerSec: 0, failureRate: 1, duplicateRate: 0, maxAttempts: 5, backoffBaseMs: 100, processMinMs: 10, processMaxMs: 10, consumers: 1 });
    spike(sim, 1);
    const attemptTimes = [];
    let last = 0;
    for (let t = 0; t < 5_000; t += 5) {
      step(sim, 5);
      const head = sim.partitions.find((p) => p.queue.length)?.queue[0];
      if (head && head.attempts !== last) {
        attemptTimes.push(sim.now);
        last = head.attempts;
      }
    }
    const gaps = attemptTimes.slice(1).map((t, i) => t - attemptTimes[i]);
    // gap = processing (10ms) + backoff (100, 200, 400, ...)
    gaps.forEach((g, i) => i > 0 && expect(g).toBeGreaterThan(gaps[i - 1]));
  });
});

describe("idempotency", () => {
  it("ignores duplicate deliveries of the same event", () => {
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
  it("never loses an event", () => {
    const sim = createSim({ ratePerSec: 12, failureRate: 0.15, duplicateRate: 0.05 }, 3);
    step(sim, 8_000);
    killConsumer(sim, sim.consumers[0].id);
    step(sim, 8_000);
    const delivered = sim.stats.produced + sim.stats.duplicatesSent;
    const accounted = sim.stats.applied + sim.stats.deduped + sim.stats.outOfOrder + sim.stats.dlq + pending(sim);
    expect(accounted).toBe(delivered);
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
});
