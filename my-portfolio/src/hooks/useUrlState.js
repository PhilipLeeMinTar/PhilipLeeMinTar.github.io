import { useCallback, useEffect, useRef, useState } from "react";
import { isKnownSkill } from "../data/skillUsage";

// Selected skill lives in ?skill=<id> so a filtered view can be shared.
export function useSkillParam() {
  // Unknown ids (typos, stale links, crafted text) are ignored.
  const [skill, setSkillState] = useState(() => {
    const id = new URLSearchParams(location.search).get("skill");
    return isKnownSkill(id) ? id : null;
  });

  const setSkill = useCallback((value) => {
    const next = isKnownSkill(value) ? value : null;
    const url = new URL(location.href);
    if (next) url.searchParams.set("skill", next);
    else url.searchParams.delete("skill");
    history.replaceState(history.state, "", url);
    setSkillState(next);
  }, []);

  return [skill, setSkill];
}

const PROJECT_HASH = /^#project\/([\w-]+)$/;

// Open project dialog lives in #project/<slug> so it can be deep-linked.
// Opening from the page pushes a history entry, so the browser/OS Back gesture
// closes the dialog instead of leaving the site; closing pops that entry again.
export function useProjectHash(validSlugs) {
  const read = () => {
    const m = location.hash.match(PROJECT_HASH);
    return m && validSlugs.includes(m[1]) ? m[1] : null;
  };
  const [slug, setSlugState] = useState(read);
  const pushed = useRef(false);

  useEffect(() => {
    const onNavigate = () => {
      pushed.current = false;
      setSlugState(read());
    };
    window.addEventListener("popstate", onNavigate);
    window.addEventListener("hashchange", onNavigate);
    return () => {
      window.removeEventListener("popstate", onNavigate);
      window.removeEventListener("hashchange", onNavigate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSlug = useCallback((next) => {
    const url = new URL(location.href);
    if (next) {
      url.hash = `project/${next}`;
      if (PROJECT_HASH.test(location.hash)) {
        history.replaceState(history.state, "", url);
      } else {
        history.pushState(history.state, "", url);
        pushed.current = true;
      }
    } else if (pushed.current) {
      pushed.current = false;
      history.back(); // popstate syncs state
    } else if (PROJECT_HASH.test(location.hash)) {
      url.hash = ""; // opened via a deep link: just drop the hash
      history.replaceState(history.state, "", url);
    }
    setSlugState(next);
  }, []);

  return [slug, setSlug];
}
