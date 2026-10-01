import { useCallback, useEffect, useState } from "react";
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
export function useProjectHash(validSlugs) {
  const read = () => {
    const m = location.hash.match(PROJECT_HASH);
    return m && validSlugs.includes(m[1]) ? m[1] : null;
  };
  const [slug, setSlugState] = useState(read);

  useEffect(() => {
    const onHash = () => setSlugState(read());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSlug = useCallback((next) => {
    const url = new URL(location.href);
    url.hash = next ? `project/${next}` : "projects";
    history.replaceState(history.state, "", url);
    setSlugState(next);
  }, []);

  return [slug, setSlug];
}
