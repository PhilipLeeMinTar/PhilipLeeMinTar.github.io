import { NAV } from "./nav";
import { profile } from "./profile";
import { projects } from "./projects";
import { usedSkillGroups } from "./skillUsage";

const scrollTo = (id) => {
  document.getElementById(id)?.scrollIntoView({ block: "start" });
  history.replaceState(history.state, "", `#${id}`);
};

const openTab = (url) => window.open(url, "_blank", "noopener,noreferrer");

// Command registry for the ⌘K palette. `actions` are app-level callbacks from App.jsx.
export function buildCommands(actions) {
  return [
    ...NAV.map((n) => ({ id: `go-${n.id}`, group: "Go to", label: n.label, run: () => scrollTo(n.id) })),
    { id: "theme", group: "Actions", label: "Toggle light / dark theme", run: actions.toggleTheme },
    { id: "copy-email", group: "Actions", label: "Copy email address", hint: profile.email, run: actions.copyEmail },
    { id: "mail", group: "Actions", label: "Send an email", run: () => (location.href = `mailto:${profile.email}`) },
    { id: "bless", group: "Actions", label: "Bless this site ✨", run: actions.bless },
    { id: "linkedin", group: "Links", label: "Open LinkedIn", run: () => openTab(profile.links.linkedin) },
    { id: "github", group: "Links", label: "Open GitHub", run: () => openTab(profile.links.github) },
    ...projects.map((p) => ({
      id: `project-${p.slug}`,
      group: "Projects",
      label: p.title,
      hint: p.period,
      run: () => actions.openProject(p.slug),
    })),
    ...usedSkillGroups.flatMap((g) =>
      g.skills.map((s) => ({ id: `skill-${s.id}`, group: "Highlight skill", label: s.label, run: () => actions.filterSkill(s.id) })),
    ),
  ];
}
