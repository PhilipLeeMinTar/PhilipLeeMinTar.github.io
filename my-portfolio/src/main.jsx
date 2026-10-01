import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// After a redeploy, old hashed chunks (demo, palette) no longer exist. If a lazy
// import fails because of that, reload to pick up the new build — at most once a
// minute, so a genuinely offline visitor doesn't get a reload loop.
window.addEventListener("vite:preloadError", (event) => {
  try {
    const last = Number(sessionStorage.getItem("chunk-reload-at")) || 0;
    if (Date.now() - last < 60_000) return;
    sessionStorage.setItem("chunk-reload-at", String(Date.now()));
  } catch {
    return;
  }
  event.preventDefault();
  location.reload();
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* `m` components + domAnimation keep the full `motion` bundle out; strict forbids `motion.*`.
        Features load synchronously: section visibility must never depend on a lazy chunk. */}
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
