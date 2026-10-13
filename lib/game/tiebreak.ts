// candidates: ids empatados; bestVotes: lista de bestId do re-voto;
// submittedAt: mapa de quando cada jogador enviou a resposta original.
// prefer: empate persistente cai em quem respondeu primeiro ("earliest", desempate do melhor)
// ou por ultimo ("latest", desempate do pior). Rapidez protege dos dois lados.
export function resolveTiebreak(
  candidates: string[],
  bestVotes: (string | null)[],
  submittedAt: Record<string, number>,
  prefer: "earliest" | "latest" = "earliest",
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
  // desempate final: menor (earliest) ou maior (latest) submittedAt; quem nao tem horario fica em ultimo na preferencia (nunca vence o desempate final)
  if (prefer === "latest") {
    return top.reduce((best, id) =>
      (submittedAt[id] ?? -Infinity) > (submittedAt[best] ?? -Infinity) ? id : best,
    );
  }
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
