import { ExternalIcon } from "../components/ui/icons";
import Section from "../components/ui/Section";
import github from "../data/github.json";
import { profile } from "../data/profile";

const dateFmt = new Intl.DateTimeFormat("en-SG", { month: "short", year: "numeric" });

function LanguageBar({ languages }) {
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
        {languages.map((l, i) => (
          <span
            key={l.lang}
            style={{ width: `${l.pct}%`, opacity: 1 - i * 0.18 }}
            className="h-full bg-accent first:rounded-l-full"
            title={`${l.lang} ${l.pct}%`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-subtle">{languages.map((l) => `${l.lang} ${l.pct}%`).join(" · ")}</p>
    </div>
  );
}

export default function GitHub() {
  if (!github.repos.length) return null;

  return (
    <Section
      id="github"
      eyebrow="05 · Open source"
      title="On GitHub"
      intro={
        <>
          A few public repos, snapshotted at build time
          {github.generatedAt && <> ({dateFmt.format(new Date(github.generatedAt))})</>}. Most of my day-to-day work is
          in private company repos.
        </>
      }
      wide
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {github.repos.map((r) => (
          <li key={r.name} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 break-all font-mono text-sm font-semibold hover:text-accent"
            >
              {r.name}
              <ExternalIcon />
              <span className="sr-only">(opens in new tab)</span>
            </a>
            <p className="mt-2 flex-1 text-sm text-muted">{r.description}</p>
            <div className="mt-4">
              <LanguageBar languages={r.languages} />
            </div>
            <p className="mt-3 font-mono text-xs text-subtle">
              {r.stars > 0 && <>★ {r.stars} · </>}updated {dateFmt.format(new Date(r.pushedAt))}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm">
        <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
          More on github.com/{profile.github} →<span className="sr-only"> (opens in new tab)</span>
        </a>
      </p>
    </Section>
  );
}
