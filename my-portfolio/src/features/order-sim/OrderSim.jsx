import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  addConsumer,
  createSim,
  DEFAULT_CONFIG,
  killConsumer,
  setConfig,
  snapshot,
  spike,
  STATUSES,
  step,
} from "./engine";

const MAX_CONSUMERS = 6;
const RENDER_EVERY_MS = 100;

const STATUS_STYLE = {
  CREATED: "bg-subtle",
  PICKED_UP: "bg-accent",
  IN_TRANSIT: "bg-warn",
  DELIVERED: "bg-ok",
};
const STATUS_LABEL = { CREATED: "Created", PICKED_UP: "Picked up", IN_TRANSIT: "In transit", DELIVERED: "Delivered" };

const ms = (v) => `${Math.round(v)} ms`;

function Metric({ label, value, tone = "" }) {
  return (
    <div className="rounded-xl border border-line bg-bg p-3">
      <dt className="text-[11px] uppercase tracking-wider text-subtle">{label}</dt>
      <dd className={`mt-0.5 font-mono text-lg font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

function Slider({ id, label, value, min, max, stepBy = 1, format, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-muted">{format(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={stepBy}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--accent)]"
      />
    </div>
  );
}

const btn =
  "rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40";

export default function OrderSim() {
  const reduceMotion = useReducedMotion();
  const simRef = useRef(null);
  if (!simRef.current) simRef.current = createSim({}, 2024);

  const [view, setView] = useState(() => snapshot(simRef.current));
  const [running, setRunning] = useState(!reduceMotion);
  const [rate, setRate] = useState(DEFAULT_CONFIG.ratePerSec);
  const [failure, setFailure] = useState(DEFAULT_CONFIG.failureRate);
  const containerRef = useRef(null);
  const [onScreen, setOnScreen] = useState(true);

  const refresh = useCallback(() => setView(snapshot(simRef.current)), []);

  // Only burn CPU while visible.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running || !onScreen) return;
    let raf;
    let last = performance.now();
    let sinceRender = 0;
    const loop = (t) => {
      const dt = Math.min(100, t - last); // clamp after tab switches
      last = t;
      if (document.visibilityState === "visible") {
        step(simRef.current, dt);
        sinceRender += dt;
        if (sinceRender >= RENDER_EVERY_MS) {
          sinceRender = 0;
          refresh();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, onScreen, refresh]);

  const act = (fn) => () => {
    fn(simRef.current);
    refresh();
  };

  const reset = () => {
    simRef.current = createSim({ ratePerSec: rate, failureRate: failure }, Date.now() % 100000);
    refresh();
  };

  const alive = view.consumers.length;
  const m = view.metrics;

  return (
    <div ref={containerRef} className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      {/* Controls */}
      <div className="grid gap-5 border-b border-line pb-5 md:grid-cols-[auto_1fr_1fr]">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={btn} onClick={() => setRunning((r) => !r)} aria-pressed={running}>
            {running ? "❚❚ Pause" : "▶ Run"}
          </button>
          {!running && (
            <button type="button" className={btn} onClick={act((s) => step(s, 500))}>
              Step +500ms
            </button>
          )}
          <button type="button" className={btn} onClick={reset}>
            Reset
          </button>
          <button type="button" className={`${btn} border-warn/60 text-warn`} onClick={act((s) => spike(s, 40))}>
            ⚡ Traffic spike
          </button>
        </div>
        <Slider
          id="sim-rate"
          label="Order events / sec"
          value={rate}
          min={1}
          max={30}
          format={(v) => `${v}/s`}
          onChange={(v) => {
            setRate(v);
            setConfig(simRef.current, { ratePerSec: v });
          }}
        />
        <Slider
          id="sim-failure"
          label="Processing failure rate"
          value={failure}
          min={0}
          max={0.6}
          stepBy={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => {
            setFailure(v);
            setConfig(simRef.current, { failureRate: v });
          }}
        />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-5">
          {/* Topic */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-mono text-sm font-semibold">
                topic: <span className="text-accent">order-status-events</span>
              </h3>
              {view.rebalancing && (
                <span className="rounded-full border border-warn/50 bg-warn/10 px-2.5 py-0.5 text-xs font-semibold text-fg">Rebalancing…</span>
              )}
            </div>
            <ul className="space-y-2">
              {view.partitions.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2">
                  <span className="w-8 shrink-0 font-mono text-xs font-semibold">P{p.id}</span>
                  <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden" aria-hidden="true">
                    {p.preview.map((e) => (
                      <span
                        key={e.offset}
                        title={`offset ${e.offset} · event #${e.eventId} ${e.status}${e.retrying ? " (retrying)" : ""}`}
                        className={`h-3 w-3 shrink-0 rounded-sm ${STATUS_STYLE[e.status]} ${e.retrying ? "ring-2 ring-bad" : ""}`}
                      />
                    ))}
                    {p.depth > p.preview.length && <span className="ml-1 font-mono text-xs text-subtle">+{p.depth - p.preview.length}</span>}
                    {p.depth === 0 && <span className="text-xs text-subtle">empty</span>}
                  </span>
                  <span className="sr-only">{p.depth} events queued</span>
                  {p.blocked && <span className="shrink-0 text-xs font-medium text-bad">retry backoff</span>}
                  <span className={`shrink-0 font-mono text-xs ${p.owner ? "text-muted" : "text-bad"}`}>
                    → {p.owner ?? "unassigned"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-subtle">
              {STATUSES.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-sm ${STATUS_STYLE[s]}`} /> {STATUS_LABEL[s]}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm ring-2 ring-bad" /> Retrying
              </span>
            </p>
          </div>

          {/* Consumer group */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-mono text-sm font-semibold">
                consumer group: <span className="text-accent">tracking-sync</span>
              </h3>
              <button
                type="button"
                className={btn}
                disabled={alive >= MAX_CONSUMERS}
                onClick={act((s) => addConsumer(s))}
              >
                + Add consumer
              </button>
            </div>
            {alive === 0 && (
              <p className="mb-2 rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">
                No live consumers — events are piling up. Add one to drain the backlog.
              </p>
            )}
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {view.consumers.map((c) => (
                <li key={c.id} className="rounded-lg border border-line bg-bg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{c.id}</span>
                    <button
                      type="button"
                      onClick={act((s) => killConsumer(s, c.id))}
                      className="rounded px-2 py-0.5 text-xs font-medium text-bad hover:bg-bad/10"
                      aria-label={`Kill consumer ${c.id}`}
                    >
                      Kill
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-xs text-subtle">
                    owns {c.partitions.length ? c.partitions.map((p) => `P${p}`).join(", ") : "—"} · {c.processed} done
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {c.busy ? (
                      <>
                        processing <span className="font-mono">{c.busy.orderId}</span> {STATUS_LABEL[c.busy.status]}
                      </>
                    ) : (
                      "idle"
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Read model */}
          <div>
            <h3 className="mb-2 font-mono text-sm font-semibold">
              read model: <span className="text-accent">latest status per order</span>
            </h3>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {view.recentOrders.map((o) => (
                <li key={o.orderId} className="flex items-center justify-between rounded-lg border border-line bg-bg px-3 py-1.5 text-sm">
                  <span className="font-mono text-xs">{o.orderId}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[o.status]}`} />
                    {STATUS_LABEL[o.status]}
                  </span>
                </li>
              ))}
              {view.recentOrders.length === 0 && <li className="text-sm text-subtle">No orders processed yet.</li>}
            </ul>
          </div>
        </div>

        {/* Metrics + log */}
        <aside className="space-y-4" aria-label="Pipeline metrics">
          <dl className="grid grid-cols-2 gap-2">
            <Metric label="Throughput" value={`${m.throughput.toFixed(1)}/s`} />
            <Metric label="Consumer lag" value={m.lag} tone={m.lag > 50 ? "text-bad" : m.lag > 15 ? "text-warn" : ""} />
            <Metric label="p50 latency" value={ms(m.p50)} />
            <Metric label="p99 latency" value={ms(m.p99)} tone={m.p99 > 3000 ? "text-warn" : ""} />
            <Metric label="Retries" value={m.retries} />
            <Metric label="Dead-lettered" value={m.dlq} tone={m.dlq ? "text-bad" : ""} />
            <Metric label="Duplicates ignored" value={m.deduped} />
            <Metric label="Redelivered" value={m.redelivered} />
          </dl>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle">Event log</h3>
            <ol className="space-y-1 font-mono text-[11px] leading-snug">
              {view.log.map((l) => (
                <li
                  key={l.seq}
                  className={l.kind === "bad" ? "text-bad" : l.kind === "warn" ? "text-warn" : "text-muted"}
                >
                  <span className="text-subtle">{(l.t / 1000).toFixed(1)}s</span> {l.text}
                </li>
              ))}
              {view.log.length === 0 && <li className="text-subtle">Try a spike, or kill a consumer.</li>}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
