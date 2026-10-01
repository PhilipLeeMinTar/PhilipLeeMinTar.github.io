import { CopyIcon, ExternalIcon } from "../components/ui/icons";
import Section from "../components/ui/Section";
import { profile } from "../data/profile";

const linkClass =
  "inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 font-medium transition-colors hover:border-accent hover:text-accent";

export default function Contact({ onCopyEmail }) {
  return (
    <Section
      id="contact"
      eyebrow="06 · Contact"
      title="Let's talk"
      intro="Open to conversations about backend, distributed systems and interesting engineering problems."
    >
      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-subtle">Email</p>
          <a href={`mailto:${profile.email}`} className="mt-1 block text-xl font-semibold hover:text-accent sm:text-2xl">
            {profile.email}
          </a>
        </div>
        <button
          type="button"
          onClick={onCopyEmail}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-fg px-5 py-2.5 font-medium text-bg"
        >
          <CopyIcon /> Copy email
        </button>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className={linkClass}>
          LinkedIn <ExternalIcon />
          <span className="sr-only">(opens in new tab)</span>
        </a>
        <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className={linkClass}>
          GitHub <ExternalIcon />
          <span className="sr-only">(opens in new tab)</span>
        </a>
      </div>
    </Section>
  );
}
