import Section from "../components/ui/Section";
import { profile } from "../data/profile";

export default function About() {
  return (
    <Section id="about" eyebrow="01 · About" title="Hi, I'm Min.">
      <div className="grid gap-10 md:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4 text-lg leading-relaxed text-muted">
          {profile.about.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </div>
        <dl className="grid content-start gap-4 rounded-2xl border border-line bg-surface p-6">
          {profile.facts.map((f) => (
            <div key={f.label}>
              <dt className="font-mono text-xs uppercase tracking-wider text-subtle">{f.label}</dt>
              <dd className="mt-0.5 font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
