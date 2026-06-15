export function scoreCommandSearch(query: string, text: string): number {
  if (!query) return 1;

  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) {
    const starts = t.startsWith(q) ? 1000 : 0;
    return 500 + starts - t.indexOf(q);
  }

  let qi = 0;
  let score = 0;
  let lastMatch = -2;
  for (let i = 0; i < t.length && qi < q.length; i += 1) {
    if (t[i] === q[qi]) {
      score += i - lastMatch === 1 ? 5 : 1;
      lastMatch = i;
      qi += 1;
    }
  }

  return qi === q.length ? score : 0;
}
