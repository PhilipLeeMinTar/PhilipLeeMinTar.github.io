import { AnimatePresence, m } from "framer-motion";

// Always-mounted live region so screen readers announce messages.
export default function Toast({ message }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <m.div
            key={message.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="rounded-full bg-fg px-4 py-2 text-sm font-medium text-bg shadow-lg"
          >
            {message.text}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
