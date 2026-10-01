import { useEffect, useRef } from "react";

// Native <dialog> with showModal(): focus trap, Esc to close and focus restore come from the browser.
export default function Dialog({ open, onClose, labelledBy, className = "", children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    // Backdrop click closes; keyboard users get Esc via the native dialog.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[min(42rem,calc(100vw-2rem))] rounded-2xl border border-line bg-bg p-0 text-fg shadow-2xl ${className}`}
    >
      {open && children}
    </dialog>
  );
}
