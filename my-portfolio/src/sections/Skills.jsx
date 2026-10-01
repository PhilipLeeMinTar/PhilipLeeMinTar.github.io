import Chip from "../components/ui/Chip";
import { experience } from "../data/experience";
import { projects } from "../data/projects";
import { skillGroups } from "../data/skills";

// How many jobs/projects use each skill — derived from content, so it can't drift.
const usage = {};
for (const item of [...experience, ...projects]) {
  for (const t of item.tags) usage[t] = (usage[t] ?? 0) + 1;
}

export default function Skills({ skill, onSelect }) {
  return (
    <div className="mb-10 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Filter by skill</h3>
        <p className="text-sm text-subtle" aria-live="polite">
          {skill ? (
            <>
              Highlighting work that uses this skill ·{" "}
              <button type="button" onClick={() => onSelect(null)} className="underline hover:text-fg">
                Clear filter
              </button>
            </>
          ) : (
            "Pick one to highlight the matching jobs and projects."
          )}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {skillGroups.map((g) => (
          <div key={g.name}>
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-subtle">{g.name}</p>
            <div className="flex flex-wrap gap-2">
              {g.skills
                .filter((s) => usage[s.id])
                .map((s) => (
                  <Chip
                    key={s.id}
                    active={skill === s.id}
                    onClick={() => onSelect(skill === s.id ? null : s.id)}
                    title={`Used in ${usage[s.id]} job(s)/project(s)`}
                  >
                    {s.label}
                    <span aria-hidden="true" className="ml-1.5 opacity-60">
                      {usage[s.id]}
                    </span>
                  </Chip>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
