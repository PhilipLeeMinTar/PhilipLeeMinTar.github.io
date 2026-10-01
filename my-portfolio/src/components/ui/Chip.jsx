export default function Chip({ children, active = false, onClick, title }) {
  const base = "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors";
  const tone = active
    ? "border-accent bg-accent text-accent-fg"
    : "border-line bg-surface text-muted hover:border-accent hover:text-fg";

  if (!onClick) return <span className={`${base} ${tone}`}>{children}</span>;
  return (
    <button type="button" aria-pressed={active} onClick={onClick} title={title} className={`${base} ${tone} cursor-pointer`}>
      {children}
    </button>
  );
}
