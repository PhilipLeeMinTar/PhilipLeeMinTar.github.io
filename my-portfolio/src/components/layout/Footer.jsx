import BlessingCounter from "../../features/blessing/BlessingCounter";
import { profile } from "../../data/profile";

export default function Footer({ blessings, onBless }) {
  return (
    <footer className="mt-8 border-t border-line bg-surface py-12 text-center">
      <BlessingCounter count={blessings} onBless={onBless} />
      <p className="mt-8 text-sm text-subtle">
        Built with React, Vite, Tailwind and framer-motion ·{" "}
        <a href={profile.siteRepo} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">
          source on GitHub<span className="sr-only"> (opens in new tab)</span>
        </a>
      </p>
    </footer>
  );
}
