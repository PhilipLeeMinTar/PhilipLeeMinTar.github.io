import { useEffect, useMemo, useRef, useState } from "react";
import Dialog from "../../components/ui/Dialog";
import { SearchIcon } from "../../components/ui/icons";
import { fuzzyFilter } from "../../lib/fuzzy";

// ARIA combobox + listbox (aria-activedescendant) inside a native modal dialog.
export default function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef(null);

  const results = useMemo(() => fuzzyFilter(commands, query, (c) => `${c.group} ${c.label}`), [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (cmd) => {
    onClose();
    // Let the dialog close (and restore focus) before running scroll/focus-affecting commands.
    requestAnimationFrame(() => cmd.run());
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(results.length - 1);
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      run(results[active]);
    }
  };

  let lastGroup = null;

  return (
    <Dialog open={open} onClose={onClose} labelledBy="palette-label" className="mt-[12vh] mb-auto">
      <div className="flex items-center gap-3 border-b border-line px-4">
        <span className="text-subtle">
          <SearchIcon />
        </span>
        <label id="palette-label" htmlFor="palette-input" className="sr-only">
          Search commands
        </label>
        <input
          id="palette-input"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Jump to a section, project or skill…"
          className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-subtle"
        />
        <kbd className="rounded border border-line px-1.5 font-mono text-[11px] text-subtle">esc</kbd>
      </div>
      <ul id="palette-list" role="listbox" ref={listRef} aria-label="Commands" className="max-h-[50vh] overflow-y-auto p-2">
        {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-subtle">No matches.</li>}
        {results.map((c, i) => {
          const header = !query && c.group !== lastGroup ? c.group : null;
          lastGroup = c.group;
          return (
            <li key={c.id} role="presentation">
              {header && (
                <div role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-subtle">
                  {header}
                </div>
              )}
              {/* Keyboard handled by the combobox input; clicks are a convenience. */}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
              <div
                id={`cmd-${c.id}`}
                role="option"
                aria-selected={i === active}
                data-index={i}
                tabIndex={-1}
                onMouseMove={() => setActive(i)}
                onClick={() => run(c)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                  i === active ? "bg-accent text-accent-fg" : "text-fg"
                }`}
              >
                <span>
                  {query && <span className={`mr-2 text-xs ${i === active ? "" : "text-subtle"}`}>{c.group} ›</span>}
                  {c.label}
                </span>
                {c.hint && <span className={`truncate text-xs ${i === active ? "" : "text-subtle"}`}>{c.hint}</span>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-4 border-t border-line px-4 py-2 text-[11px] text-subtle">
        <span>↑↓ navigate</span>
        <span>↵ select</span>
        <span>esc close</span>
      </div>
    </Dialog>
  );
}
