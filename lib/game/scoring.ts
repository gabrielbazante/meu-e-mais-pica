export interface RoundDeltasInput {
  playerIds: string[];
  answeredIds: string[];   // inclui autores de respostas voided
  bestId: string | null;
  worstId: string | null;
  currentTotals: Record<string, number>;
}

// Delta efetivamente aplicado à pontuação total de cada jogador na rodada.
// melhor=+10, pior=0, respondeu=+2, nao respondeu=-1 (piso em 0 no total).
export function roundDeltas(input: RoundDeltasInput): Record<string, number> {
  const answered = new Set(input.answeredIds);
  const deltas: Record<string, number> = {};
  for (const id of input.playerIds) {
    if (id === input.bestId) deltas[id] = 10;
    else if (id === input.worstId) deltas[id] = 0;
    else if (answered.has(id)) deltas[id] = 2;
    else deltas[id] = (input.currentTotals[id] ?? 0) >= 1 ? -1 : 0;
  }
  return deltas;
}
