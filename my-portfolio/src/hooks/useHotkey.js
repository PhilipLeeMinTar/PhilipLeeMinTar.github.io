import { useEffect, useRef } from "react";

function isTyping(target) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

// Calls `handler` for ⌘K / Ctrl+K anywhere, and for "/" when not typing in a field.
export function useCommandHotkey(handler) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
      const slash = e.key === "/" && !e.metaKey && !e.ctrlKey && !isTyping(e.target);
      if (mod || slash) {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
