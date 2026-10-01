import Chip from "../components/ui/Chip";
import { describeSkillUsage, skillUsage, usedSkillGroups } from "../data/skillUsage";

// Page-wide skill highlight: matching jobs (Experience) and projects (Projects) get an accent ring.
export default function Skills({ skill, onSelect }) {
  return (
    <div className="mb-10 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">Highlight a skill</h3>
        <p className="text-sm text-muted" aria-live="polite">
          {skill ? (
            <>
              {describeSkillUsage(skill)} highlighted ·{" "}
              <button type="button" onClick={() => onSelect(null)} className="underline hover:text-fg">
                Clear
              </button>
            </>
          ) : (
            "Pick one to highlight the jobs and projects that use it."
          )}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {usedSkillGroups.map((g) => (
          <div key={g.name}>
            <p className="mb-2 font-mono text-xs uppercase tracking-wider text-subtle">{g.name}</p>
            <div className="flex flex-wrap gap-2">
              {g.skills.map((s) => {
                const u = skillUsage[s.id];
                return (
                  <Chip
                    key={s.id}
                    active={skill === s.id}
                    onClick={() => onSelect(skill === s.id ? null : s.id)}
                    title={describeSkillUsage(s.id)}
                  >
                    {s.label}
                    <span aria-hidden="true" className="ml-1.5 opacity-70">
                      {u.jobs + u.projects}
                    </span>
                  </Chip>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
