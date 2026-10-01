// Tiny subsequence fuzzy matcher. Returns a score (higher is better) or -1 for no match.
// Rewards consecutive characters and matches at word starts.
export function fuzzyScore(query, text) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const t = text.toLowerCase();
  if (t.includes(q)) return 100 - t.indexOf(q);

  let score = 0;
  let ti = 0;
  let streak = 0;
  for (const ch of q) {
    if (ch === " ") continue;
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    streak = found === ti ? streak + 1 : 0;
    const wordStart = found === 0 || /[\s\-/·]/.test(t[found - 1]);
    score += 1 + streak * 2 + (wordStart ? 3 : 0);
    ti = found + 1;
  }
  return score;
}

export function fuzzyFilter(items, query, getText) {
  if (!query.trim()) return items;
  return items
    .map((item) => ({ item, score: fuzzyScore(query, getText(item)) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}
