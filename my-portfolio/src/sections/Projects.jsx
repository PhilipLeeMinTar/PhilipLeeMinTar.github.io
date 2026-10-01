import Chip from "../components/ui/Chip";
import Dialog from "../components/ui/Dialog";
import { CloseIcon, ExternalIcon } from "../components/ui/icons";
import Section from "../components/ui/Section";
import { projects } from "../data/projects";
import { skillLabel } from "../data/skills";

function LinkButton({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
    >
      {children}
      <ExternalIcon />
      <span className="sr-only">(opens in new tab)</span>
    </a>
  );
}

function ProjectCard({ project, onOpen, highlighted }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`group flex h-full w-full flex-col rounded-2xl border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg ${
          highlighted ? "border-accent ring-2 ring-accent" : "border-line"
        }`}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="text-lg font-semibold group-hover:text-accent">{project.title}</span>
          {project.period && <span className="shrink-0 font-mono text-xs text-subtle">{project.period}</span>}
        </span>
        {project.badge && (
          <span className="mt-2 w-fit rounded-full bg-warn/15 px-2.5 py-0.5 text-xs font-semibold text-warn">
            🏆 {project.badge}
          </span>
        )}
        <span className="mt-2 flex-1 text-sm text-muted">{project.oneLiner}</span>
        <span className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((t) => (
            <Chip key={t}>{skillLabel[t] ?? t}</Chip>
          ))}
        </span>
        <span className="mt-4 text-sm font-medium text-accent">Read more →</span>
      </button>
    </li>
  );
}

function ProjectDetails({ project, onClose }) {
  return (
    <article className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="project-dialog-title" className="text-2xl font-semibold">
            {project.title}
          </h3>
          {project.period && <p className="mt-1 font-mono text-xs text-subtle">{project.period}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
        >
          <CloseIcon />
        </button>
      </div>
      {project.badge && (
        <p className="mt-3 w-fit rounded-full bg-warn/15 px-2.5 py-0.5 text-xs font-semibold text-warn">🏆 {project.badge}</p>
      )}
      <p className="mt-4 text-muted">{project.oneLiner}</p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted marker:text-subtle">
        {project.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <Chip key={t}>{skillLabel[t] ?? t}</Chip>
        ))}
      </div>
      {(project.links.live || project.links.repo) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.links.live && <LinkButton href={project.links.live}>Live demo</LinkButton>}
          {project.links.repo && <LinkButton href={project.links.repo}>Source code</LinkButton>}
        </div>
      )}
    </article>
  );
}

export default function Projects({ skill, onSkill, openSlug, onOpen }) {
  const open = projects.find((p) => p.slug === openSlug) ?? null;
  const matchCount = skill ? projects.filter((p) => p.tags.includes(skill)).length : projects.length;

  return (
    <Section
      id="projects"
      eyebrow="04 · Projects"
      title="Things I've built"
      intro={
        skill ? (
          <>
            {matchCount
              ? `${matchCount} of ${projects.length} projects use ${skillLabel[skill]} — highlighted below.`
              : `None of these projects use ${skillLabel[skill]} — it comes from my work experience above.`}{" "}
            <button type="button" onClick={() => onSkill(null)} className="underline hover:text-fg">
              Clear highlight
            </button>
          </>
        ) : (
          "From a live World Cup prediction platform to a concurrent robot-car system. Click a card for details."
        )
      }
      wide
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard
            key={p.slug}
            project={p}
            onOpen={() => onOpen(p.slug)}
            highlighted={Boolean(skill) && p.tags.includes(skill)}
          />
        ))}
      </ul>
      <Dialog open={Boolean(open)} onClose={() => onOpen(null)} labelledBy="project-dialog-title">
        {open && <ProjectDetails project={open} onClose={() => onOpen(null)} />}
      </Dialog>
    </Section>
  );
}
