import { NAV } from "../../data/nav";
import { useActiveSection } from "../../hooks/useActiveSection";
import { MoonIcon, SearchIcon, SunIcon } from "../ui/icons";

const NAV_IDS = NAV.map((n) => n.id);

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export default function Header({ theme, onToggleTheme, onOpenPalette }) {
  const active = useActiveSection(NAV_IDS);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
        <a href="#top" className="font-mono text-sm font-semibold tracking-tight">
          <span className="text-accent">~/</span>min
        </a>

        <nav aria-label="Sections" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  aria-current={active === n.id ? "true" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active === n.id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
                  }`}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-fg"
          >
            <SearchIcon />
            <span className="md:sr-only">Menu</span>
            <kbd className="hidden rounded border border-line bg-surface px-1.5 font-mono text-[11px] md:inline">
              {isMac ? "⌘" : "Ctrl"} K
            </kbd>
            <span className="sr-only">Open command palette</span>
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="rounded-md border border-line p-1.5 text-muted transition-colors hover:border-accent hover:text-fg"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
    </header>
  );
}
