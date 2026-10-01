import { experience } from "./experience";
import { projects } from "./projects";
import { skillGroups, skillLabel } from "./skills";

// How many jobs/projects use each skill — derived from content, so it can't drift.
// Shared by the skill filter and the command palette.
export const skillUsage = {};
for (const [kind, items] of [
  ["jobs", experience],
  ["projects", projects],
]) {
  for (const item of items) {
    for (const t of item.tags) {
      skillUsage[t] ??= { jobs: 0, projects: 0 };
      skillUsage[t][kind]++;
    }
  }
}

export const usedSkillGroups = skillGroups
  .map((g) => ({ ...g, skills: g.skills.filter((s) => skillUsage[s.id]) }))
  .filter((g) => g.skills.length > 0);

export const isKnownSkill = (id) => Boolean(id && skillLabel[id] && skillUsage[id]);

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function describeSkillUsage(id) {
  const u = skillUsage[id] ?? { jobs: 0, projects: 0 };
  return `${skillLabel[id]}: ${plural(u.jobs, "job")} · ${plural(u.projects, "project")}`;
}
