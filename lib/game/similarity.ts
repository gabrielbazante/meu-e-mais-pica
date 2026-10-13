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
