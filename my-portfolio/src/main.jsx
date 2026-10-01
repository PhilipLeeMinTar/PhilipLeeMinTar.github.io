import { LazyMotion, MotionConfig } from "framer-motion";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const loadFeatures = () => import("./lib/motionFeatures").then((mod) => mod.default);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* `m` components + async features keep most of framer-motion out of the critical bundle; strict forbids `motion.*`. */}
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
);
