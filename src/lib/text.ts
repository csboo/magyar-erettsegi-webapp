const charMap: Array<[RegExp, string]> = [
  ([/[áàâäãå]/g, "a"] as const),
  ([/[éèêë]/g, "e"] as const),
  ([/[íìîï]/g, "i"] as const),
  ([/[óòôöõő]/g, "o"] as const),
  ([/[úùûüũű]/g, "u"] as const),
  ([/[ýÿ]/g, "y"] as const),
  ([/[ç]/g, "c"] as const),
  ([/[š]/g, "s"] as const),
  ([/[ž]/g, "z"] as const),
];

export function normalizeText(value: string): string {
  return charMap.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value.toLowerCase(),
  );
}

export function fuzzyScore(query: string, target: string): number {
  const q = normalizeText(query.trim());
  const t = normalizeText(target);
  if (!q) {
    return 0;
  }

  const exactIndex = t.indexOf(q);
  if (exactIndex !== -1) {
    return 1000 - exactIndex;
  }

  let qi = 0;
  let score = 0;
  let lastPos = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] !== q[qi]) {
      continue;
    }
    score += lastPos === ti - 1 ? 10 : 1;
    lastPos = ti;
    qi += 1;
  }

  return qi === q.length ? score : 0;
}
