import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import Footer from "./components/layout/Footer";
import Header from "./components/layout/Header";
import Toast from "./components/ui/Toast";
import { buildCommands } from "./data/commands";
import { profile } from "./data/profile";
import { projects } from "./data/projects";
import { useCommandHotkey } from "./hooks/useHotkey";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useTheme } from "./hooks/useTheme";
import { useProjectHash, useSkillParam } from "./hooks/useUrlState";
import About from "./sections/About";
import Contact from "./sections/Contact";
import Experience from "./sections/Experience";
import GitHub from "./sections/GitHub";
import Hero from "./sections/Hero";
import Projects from "./sections/Projects";
import SystemDemo from "./sections/SystemDemo";

const CommandPalette = lazy(() => import("./features/command-palette/CommandPalette"));
const SLUGS = projects.map((p) => p.slug);

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [skill, setSkill] = useSkillParam();
  const [openProject, setOpenProject] = useProjectHash(SLUGS);
  const [blessings, setBlessings] = useLocalStorage("blessings", 0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteLoaded, setPaletteLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  const notify = useCallback((text) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      notify("Email copied to clipboard");
    } catch {
      notify(profile.email);
    }
  }, [notify]);

  const bless = useCallback(() => setBlessings((n) => n + 1), [setBlessings]);

  const openPalette = useCallback(() => {
    setPaletteLoaded(true);
    setPaletteOpen(true);
  }, []);
  useCommandHotkey(openPalette);

  const commands = useMemo(
    () =>
      buildCommands({
        toggleTheme,
        copyEmail,
        bless: () => {
          bless();
          notify("Blessed ✨");
        },
        openProject: setOpenProject,
        filterSkill: (id) => {
          setSkill(id);
          document.getElementById("projects")?.scrollIntoView({ block: "start" });
        },
      }),
    [toggleTheme, copyEmail, bless, notify, setOpenProject, setSkill],
  );

  return (
    <div className="min-h-screen bg-bg font-sans text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
      >
        Skip to content
      </a>
      <Header theme={theme} onToggleTheme={toggleTheme} onOpenPalette={openPalette} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <About />
        <SystemDemo />
        <Experience skill={skill} />
        <Projects skill={skill} onSkill={setSkill} openSlug={openProject} onOpen={setOpenProject} />
        <GitHub />
        <Contact onCopyEmail={copyEmail} />
      </main>
      <Footer blessings={blessings} onBless={bless} />
      <Toast message={toast} />
      {paletteLoaded && (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
        </Suspense>
      )}
    </div>
  );
}
