# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working in this repository.

## Overview

Personal portfolio site served via GitHub Pages at https://philipleemintar.github.io/. The repo root is a wrapper. The app lives in `my-portfolio/`: React 19, Vite 6, Tailwind CSS v4, framer-motion, plain JSX (no TypeScript).

## Commands

Run all commands from `my-portfolio/`:

```bash
npm install
npm run dev       # Vite dev server with HMR
npm test          # Vitest (engine unit tests + App smoke tests, jsdom)
npm run lint      # ESLint flat config (react, react-hooks, jsx-a11y)
npm run build     # prebuild runs scripts/fetch-github.mjs, then builds into build/ (not dist/)
npm run preview   # serve the production build
npm run deploy    # legacy manual publish of build/ to the gh-pages branch
```

**Never deploy without the owner's explicit permission.** That covers `npm run deploy`, pushing to `gh-pages`, merging to `main` once Actions deploys are enabled, and setting `PAGES_DEPLOY`.

## Architecture & conventions

- **Content is data:** `src/data/` holds `profile.js`, `experience.js`, `projects.js` and `skills.js`. The `tags` arrays in experience and projects must use skill ids from `skills.js`. `github.json` is generated at build time; commit it so offline builds work.
- **Layout:** `App.jsx` only composes `src/sections/*`. Shared UI lives in `src/components/ui`: `Section` (the fade/slide-in section shell), `Chip`, `Dialog` (native `<dialog>`) and `Toast`.
- **Animations:** use framer-motion **`m.*`**, never `motion.*`. `main.jsx` wraps the app in `<LazyMotion strict>` with async features and `<MotionConfig reducedMotion="user">`. New sections should use `<Section>` instead of repeating the motion props.
- **Order-pipeline simulation:** `src/features/order-sim/engine.js` is pure and deterministic (seeded PRNG), with no DOM. Change the engine test-first in `engine.test.js`. `OrderSim.jsx` is lazy-loaded by `SystemDemo.jsx`.
- **Theme:** tokens are CSS variables in `src/index.css` (`bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `border-line`, `text-accent`, ...), with class-based dark mode (`.dark` on `<html>`). An inline script in `index.html` applies the theme before first paint. Use the tokens, not raw gray/blue classes.
- **URL state:** `?skill=<id>` holds the project/experience filter and `#project/<slug>` the open project dialog. There's no router (GitHub Pages has no SPA rewrites).
- **Privacy:** `resume/` (a PDF with a phone number) is gitignored. Never publish the phone number or the PDF.
- **Assets:** files in `public/` are referenced by absolute path (`/avatar.webp`, `/sap-logo.svg`). `og.png` is the 1200×630 social preview.
- **Build output:** `build/` is gitignored and must not be committed.
