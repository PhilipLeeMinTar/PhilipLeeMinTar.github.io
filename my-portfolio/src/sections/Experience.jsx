import { AnimatePresence, m, useScroll, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import Chip from "../components/ui/Chip";
import { ChevronIcon } from "../components/ui/icons";
import Section from "../components/ui/Section";
import { experience } from "../data/experience";
import { skillLabel } from "../data/skills";

function OrgMark({ item }) {
  if (item.logo) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white p-1.5">
        <img src={item.logo} alt="" width={28} height={28} loading="lazy" className="h-auto w-full" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 font-mono text-[11px] font-semibold"
    >
      {item.initials}
    </span>
  );
}

function TimelineItem({ item, open, onToggle, dimmed }) {
  const panelId = `exp-${item.id}-panel`;
  return (
    <li className={`relative pl-14 transition-opacity ${dimmed ? "opacity-40" : ""}`}>
      <div className="absolute left-0 top-1">
        <OrgMark item={item} />
      </div>
      <div className="rounded-2xl border border-line bg-surface transition-shadow hover:shadow-md">
        <h3>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={onToggle}
            className="flex w-full items-start gap-4 p-5 text-left"
          >
            <span className="flex-1">
              <span className="block text-lg font-semibold">{item.org}</span>
              <span className="block text-muted">{item.role}</span>
              <span className="mt-1 block font-mono text-xs text-subtle">
                {item.start} – {item.end} · {item.location}
              </span>
              <span className="mt-3 block text-sm text-muted">{item.summary}</span>
            </span>
            <m.span animate={{ rotate: open ? 180 : 0 }} className="mt-1 text-subtle">
              <ChevronIcon />
            </m.span>
            <span className="sr-only">{open ? "Hide details" : "Show details"}</span>
          </button>
        </h3>
        <AnimatePresence initial={false}>
          {open && (
            <m.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-line px-5 pb-5 pt-4">
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:text-subtle">
                  {item.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                {item.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((t) => (
                      <Chip key={t}>{skillLabel[t] ?? t}</Chip>
                    ))}
                  </div>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

export default function Experience({ skill }) {
  const [openId, setOpenId] = useState(experience[0].id);
  const listRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 80%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <Section
      id="experience"
      eyebrow="03 · Experience"
      title="Where I've worked"
      intro="Backend engineering from internship to production ownership. Expand a stop for the details."
    >
      <div ref={listRef} className="relative">
        <div aria-hidden="true" className="absolute bottom-4 left-5 top-4 w-px bg-line" />
        <m.div
          aria-hidden="true"
          style={{ scaleY: fill }}
          className="absolute bottom-4 left-5 top-4 w-px origin-top bg-accent"
        />
        <ol className="relative space-y-6">
          {experience.map((item) => (
            <TimelineItem
              key={item.id}
              item={item}
              open={openId === item.id}
              onToggle={() => setOpenId((id) => (id === item.id ? null : item.id))}
              dimmed={Boolean(skill) && item.kind === "work" && !item.tags.includes(skill)}
            />
          ))}
        </ol>
      </div>
    </Section>
  );
}
