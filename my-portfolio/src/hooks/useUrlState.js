import { useCallback, useEffect, useState } from "react";

// Selected skill lives in ?skill=<id> so a filtered view can be shared.
export function useSkillParam() {
  const [skill, setSkillState] = useState(() => new URLSearchParams(location.search).get("skill"));

  const setSkill = useCallback((next) => {
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
