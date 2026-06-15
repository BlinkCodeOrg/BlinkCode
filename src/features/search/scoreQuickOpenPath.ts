export function scoreQuickOpenPath(query: string, target: string): number {
  const ql = query.toLowerCase();
  const tl = target.toLowerCase();
  let score = 0;
  let qi = 0;
  let consecutive = 0;

  for (let ti = 0; ti < tl.length && qi < ql.length; ti += 1) {
    if (tl[ti] === ql[qi]) {
      if (ti === 0 || target[ti - 1] === '/' || target[ti - 1] === '\\') score += 3;
      else if (consecutive > 0) score += 2;
      else score += 1;
      consecutive += 1;
      qi += 1;
    } else {
      consecutive = 0;
    }
  }

  if (qi < ql.length) return -1;
  return score - target.length * 0.05;
}
