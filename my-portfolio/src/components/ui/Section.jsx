import { m } from "framer-motion";

// Shared section shell: fade/slide-in on first view, labelled landmark, anchor offset for the sticky header.
export default function Section({ id, eyebrow, title, intro, wide = false, children }) {
  return (
    <m.section
      id={id}
      aria-labelledby={`${id}-title`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true, margin: "-80px" }}
      className={`mx-auto scroll-mt-20 px-6 py-16 sm:py-20 ${wide ? "max-w-6xl" : "max-w-5xl"}`}
    >
      <header className="mb-10">
        {eyebrow && (
          <p className="mb-2 font-mono text-xs font-medium uppercase tracking-widest text-accent">{eyebrow}</p>
        )}
        <h2 id={`${id}-title`} className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h2>
        {intro && <p className="mt-3 max-w-2xl text-muted">{intro}</p>}
      </header>
      {children}
    </m.section>
  );
}
