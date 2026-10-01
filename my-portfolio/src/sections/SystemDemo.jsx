import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Section from "../components/ui/Section";

const OrderSim = lazy(() => import("../features/order-sim/OrderSim"));

const CONCEPTS = [
  ["Partitioning by key", "Every event for an order lands on the same partition, so its statuses are applied in order."],
  ["Consumer groups", "Each partition has exactly one owner. Kill a consumer and its partitions are rebalanced to the rest."],
  ["Retries & DLQ", "Failures retry with exponential backoff, blocking the partition to keep order, then go to a dead-letter queue."],
  ["Idempotency", "Producers deliver at-least-once; consumers dedupe by event id so a retry never double-applies."],
];

export default function SystemDemo() {
  // Load the simulation chunk only when the section approaches the viewport.
  const ref = useRef(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Section
      id="system"
      eyebrow="02 · Live demo"
      title="An event-driven order pipeline, running in your browser"
      intro="Inspired by the kind of systems I build at work — simplified, with no proprietary details. Spike the traffic, crank up failures or kill a consumer, and watch the pipeline cope."
      wide
    >
      <div ref={ref}>
        {load ? (
          <Suspense fallback={<div className="h-[560px] animate-pulse rounded-2xl border border-line bg-surface" />}>
            <OrderSim />
          </Suspense>
        ) : (
          <div className="h-[560px] rounded-2xl border border-line bg-surface" />
        )}
      </div>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CONCEPTS.map(([term, desc]) => (
          <div key={term}>
            <dt className="font-semibold">{term}</dt>
            <dd className="mt-1 text-sm text-muted">{desc}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs text-subtle">
        The simulation is a pure, seeded JavaScript engine with unit tests for ordering, rebalancing, retries and
        idempotency —{" "}
        <a
          href="https://github.com/PhilipLeeMinTar/PhilipLeeMinTar.github.io/tree/main/my-portfolio/src/features/order-sim"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-fg"
        >
          read the source<span className="sr-only"> (opens in new tab)</span>
        </a>
        .
      </p>
    </Section>
  );
}
