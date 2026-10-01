import { m } from "framer-motion";
import { profile } from "../data/profile";

// The name and avatar are the LCP elements, so they only slide (no fade from opacity 0).
const rise = (delay = 0) => ({
  initial: { y: 10 },
  animate: { y: 0 },
  transition: { duration: 0.6, delay },
});

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 opacity-40 dark:opacity-20">
        <div className="absolute left-10 top-20 h-32 w-32 rounded-full bg-accent/20" />
        <div className="absolute right-20 top-40 h-24 w-24 rounded-full bg-surface-2" />
        <div className="absolute bottom-20 left-1/4 h-16 w-16 rounded-full bg-surface-2" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[1.4fr_1fr]">
        <div className="text-center lg:text-left">
          <m.p {...rise()} className="font-mono text-sm text-accent">
            {profile.title} · {profile.location}
          </m.p>
          <m.h1
            id="hero-title"
            {...rise(0.05)}
            className="mt-3 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl"
          >
            {profile.name}
          </m.h1>
          <m.p {...rise(0.1)} className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl lg:mx-0">
            {profile.tagline}
          </m.p>
          <m.div {...rise(0.15)} className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <a
              href="#system"
              className="inline-flex items-center justify-center rounded-full bg-fg px-7 py-3.5 font-medium text-bg shadow-lg transition-shadow hover:shadow-xl"
            >
              Try the live system demo
            </a>
            <a
              href="#experience"
              className="inline-flex items-center justify-center rounded-full border-2 border-line px-7 py-3.5 font-medium transition-colors hover:border-accent"
            >
              Experience
            </a>
            <a
              href={profile.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-3.5 font-medium text-muted underline-offset-4 hover:text-fg hover:underline"
            >
              GitHub<span className="sr-only"> (opens in new tab)</span>
            </a>
          </m.div>
        </div>

        <m.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex justify-center"
        >
          <div aria-hidden="true" className="absolute -inset-4 rounded-full bg-surface-2 blur-2xl" />
          <img
            src={profile.avatar}
            alt="Profile avatar: SpongeBob in a police uniform"
            width={256}
            height={256}
            fetchPriority="high"
            decoding="async"
            className="relative z-10 h-48 w-48 rounded-full border-4 border-bg object-cover shadow-2xl ring-1 ring-line sm:h-56 sm:w-56 lg:h-64 lg:w-64"
          />
        </m.div>
      </div>
    </section>
  );
}
