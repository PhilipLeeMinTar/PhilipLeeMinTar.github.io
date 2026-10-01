import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useState } from "react";

const SPARKS = ["✨", "🙏", "⭐", "💫"];

// Easter egg: per-browser counter (persisted by the parent) with a small particle burst.
export default function BlessingCounter({ count, onBless }) {
  const reduce = useReducedMotion();
  const [bursts, setBursts] = useState([]);

  const bless = () => {
    onBless();
    if (reduce) return;
    const id = Date.now() + Math.random();
    const particles = Array.from({ length: 8 }, (_, i) => ({
      i,
      char: SPARKS[i % SPARKS.length],
      x: Math.cos((i / 8) * Math.PI * 2) * (40 + Math.random() * 30),
      y: Math.sin((i / 8) * Math.PI * 2) * (40 + Math.random() * 30) - 20,
    }));
    setBursts((b) => [...b, { id, particles }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 900);
  };

  return (
    <div className="relative inline-block">
      <m.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={bless}
        className="rounded-full bg-fg px-6 py-3 font-medium text-bg shadow-lg transition-shadow hover:shadow-xl"
      >
        Blessing Counter ✨: <span aria-live="polite">{count}</span>
      </m.button>
      <AnimatePresence>
        {bursts.flatMap((b) =>
          b.particles.map((p) => (
            <m.span
              key={`${b.id}-${p.i}`}
              aria-hidden="true"
              initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.2 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-1/2 -ml-2 -mt-3 select-none text-lg"
            >
              {p.char}
            </m.span>
          )),
        )}
      </AnimatePresence>
    </div>
  );
}
