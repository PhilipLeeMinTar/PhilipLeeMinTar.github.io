# philipleemintar.github.io

Personal portfolio of **Paing Min Htet**, Backend Engineer. Live at https://philipleemintar.github.io/

The centrepiece is a live, in-browser simulation of an event-driven order pipeline. It has a partitioned topic, a consumer group with rebalancing, retries with exponential backoff, a dead-letter queue, and idempotent consumers. The engine is a pure, seeded JavaScript module with unit tests (`my-portfolio/src/features/order-sim/`).

## Stack

- React 19, Vite 6, Tailwind CSS v4 and framer-motion (`LazyMotion` + `m`), all plain JSX
- Vitest and Testing Library
- GitHub Actions CI

## Develop

```bash
cd my-portfolio
npm install
npm run dev       # dev server
npm test          # unit + smoke tests
npm run lint
npm run build     # fetches the GitHub snapshot (prebuild), then builds into build/
npm run preview   # serve the production build
```

Site content lives in `my-portfolio/src/data/` (profile, experience, projects, skills). Edit those files rather than the components.

## Deploy

CI (`.github/workflows/ci.yml`) runs lint, tests and the build on every push and PR.

Deploys are **opt-in**:

- **Today:** the site is served from the `gh-pages` branch, published manually with `npm run deploy`.
- **Switching to GitHub Actions:** set *Settings → Pages → Source* to **GitHub Actions** and add the repository variable `PAGES_DEPLOY=true`. Every push to `main` then deploys automatically, and the `gh-pages` package and branch can be retired.

`build/` is not committed.
