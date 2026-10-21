import { normalizeAnswer } from "./normalize";

// Dica fuzzy: marca pares de respostas "possivelmente repetidas". So sugestao
// para o dono decidir — aceita falso positivo (ex.: dois "Manchester ...").
export function possibleDuplicates(
  answers: { playerId: string; text: string }[],
): Set<string> {
  const flagged = new Set<string>();
  const norm = answers.map((a) => ({ playerId: a.playerId, n: normalizeAnswer(a.text) }));
  for (let i = 0; i < norm.length; i++) {
    for (let j = i + 1; j < norm.length; j++) {
      const a = norm[i];
      const b = norm[j];
      if (!a.n || !b.n || a.playerId === b.playerId) continue;
      if (sharesLongWord(a.n, b.n) || isSubstring(a.n, b.n)) {
        flagged.add(a.playerId);
        flagged.add(b.playerId);
      }
    }
  }
  return flagged;
}

function sharesLongWord(a: string, b: string): boolean {
  const wa = new Set(a.split(" ").filter((w) => w.length >= 4));
  return b.split(" ").some((w) => w.length >= 4 && wa.has(w));
}

function isSubstring(a: string, b: string): boolean {
  return a.includes(b) || b.includes(a);
}

// Agrupa respostas parecidas (mesma regra de par de possibleDuplicates) em
// componentes conexos: se A~B e B~C, os tres formam um grupo. Cada grupo vem
// em ordem de chegada (submittedAt, depois playerId); so grupos com 2+.
export function duplicateGroups(
  answers: { playerId: string; text: string; submittedAt: number }[],
): string[][] {
  const items = answers.map((a) => ({ ...a, n: normalizeAnswer(a.text) }));
  const parent = items.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (!a.n || !b.n || a.playerId === b.playerId) continue;
      if (sharesLongWord(a.n, b.n) || isSubstring(a.n, b.n)) parent[find(i)] = find(j);
    }
  }
  const byRoot = new Map<number, typeof items>();
  items.forEach((it, i) => {
    if (!it.n) return;
    const r = find(i);
    byRoot.set(r, [...(byRoot.get(r) ?? []), it]);
  });
  const cmp = (x: { submittedAt: number; playerId: string }, y: { submittedAt: number; playerId: string }) =>
    x.submittedAt - y.submittedAt || (x.playerId < y.playerId ? -1 : x.playerId > y.playerId ? 1 : 0);
  return [...byRoot.values()]
    .filter((g) => g.length >= 2)
    .map((g) => g.sort(cmp))
    .sort((g1, g2) => cmp(g1[0], g2[0]))
    .map((g) => g.map((x) => x.playerId));
}
