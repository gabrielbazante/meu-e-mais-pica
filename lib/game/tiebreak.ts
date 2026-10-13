// candidates: ids empatados; bestVotes: lista de bestId do re-voto;
// submittedAt: mapa de quando cada jogador enviou a resposta original.
export function resolveTiebreak(
  candidates: string[],
  bestVotes: (string | null)[],
  submittedAt: Record<string, number>,
): string {
  const set = new Set(candidates);
  const counts: Record<string, number> = {};
  for (const id of candidates) counts[id] = 0;
  for (const v of bestVotes) {
    if (v && set.has(v)) counts[v] += 1;
  }
  const max = Math.max(...Object.values(counts));
  const top = candidates.filter((id) => counts[id] === max);
  if (top.length === 1) return top[0];
  // desempate final: menor submittedAt
  return top.reduce((best, id) =>
    (submittedAt[id] ?? Infinity) < (submittedAt[best] ?? Infinity) ? id : best,
  );
}

// Filtra candidatos de desempate para quem ainda tem resposta valida na rodada
// (nao-vazia e nao anulada). Um expulso perde a linha de answers (cascade) e sai daqui.
export function aliveCandidates(
  candidates: string[],
  answers: { player_id: string; text: string; voided: boolean }[],
): string[] {
  const valid = new Set(
    answers.filter((a) => a.text.trim() !== "" && !a.voided).map((a) => a.player_id),
  );
  return candidates.filter((id) => valid.has(id));
}
