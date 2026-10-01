// Build-time GitHub snapshot for the curated repos shown on the site.
// Runs as `prebuild`; writes src/data/github.json. No runtime API calls from the browser.
//
// - Uses GITHUB_TOKEN if set (CI) to avoid the 60 req/h anonymous rate limit.
// - On any failure it keeps the existing (committed) JSON and exits 0, so offline
//   builds still work.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const USER = "PhilipLeeMinTar";
// Curated allowlist (most public repos are tutorials/forks). Descriptions here
// are fallbacks for repos without a GitHub description.
const REPOS = [
  { name: "world_cup_scoreboard_2026", description: "Live World Cup 2026 prediction platform — React, Hono, SQLite, GitHub Actions." },
  { name: "quiz-generator", description: "A quiz generator built on GPT-3.5." },
  { name: "PhilipLeeMinTar.github.io", description: "This site — React, Vite, Tailwind, with a simulated event-driven backend." },
];

const OUT = fileURLToPath(new URL("../src/data/github.json", import.meta.url));

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": `${USER}-portfolio-build`,
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const repos = [];
  const totals = {};
  for (const { name, description } of REPOS) {
    const [repo, languages] = await Promise.all([gh(`/repos/${USER}/${name}`), gh(`/repos/${USER}/${name}/languages`)]);
    const bytes = Object.values(languages).reduce((a, b) => a + b, 0) || 1;
    for (const [lang, n] of Object.entries(languages)) totals[lang] = (totals[lang] ?? 0) + n;
    repos.push({
      name: repo.name,
      description: repo.description || description,
      url: repo.html_url,
      homepage: repo.homepage || null,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      pushedAt: repo.pushed_at,
      languages: Object.entries(languages)
        .map(([lang, n]) => ({ lang, pct: Math.round((n / bytes) * 1000) / 10 }))
        .filter((l) => l.pct >= 1)
        .slice(0, 4),
    });
  }
  const all = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  const data = {
    generatedAt: new Date().toISOString(),
    user: USER,
    repos,
    languages: Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([lang, n]) => ({ lang, pct: Math.round((n / all) * 1000) / 10 }))
      .filter((l) => l.pct >= 1)
      .slice(0, 6),
  };
  await writeFile(OUT, JSON.stringify(data, null, 2) + "\n");
  console.log(`github.json: ${repos.length} repos`);
}

main().catch(async (err) => {
  let existing = false;
  try {
    await readFile(OUT);
    existing = true;
  } catch {
    // no snapshot yet
  }
  console.warn(`fetch-github: ${err.message} — ${existing ? "keeping existing github.json" : "writing empty snapshot"}`);
  if (!existing) await writeFile(OUT, JSON.stringify({ generatedAt: null, user: USER, repos: [], languages: [] }, null, 2) + "\n");
});
