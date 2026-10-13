import type { Player, Vote } from "./types";

export interface TallyResult {
  bestIds: string[];   // empatados no topo de "melhor"
  worstIds: string[];  // empatados no fundo de "pior"
  needsTiebreak: boolean;
  points: Record<string, number>; // delta da rodada; vazio se needsTiebreak
}

function countVotes(ids: (string | null)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of ids) {
    if (!id) continue;
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return counts;
}

function topIds(counts: Record<string, number>): string[] {
  const max = Math.max(0, ...Object.values(counts));
  if (max === 0) return [];
  return Object.keys(counts).filter((id) => counts[id] === max);
}

export function tallyRound(players: Player[], votes: Vote[]): TallyResult {
  const bestIds = topIds(countVotes(votes.map((v) => v.bestId)));
  const worstIds = topIds(countVotes(votes.map((v) => v.worstId)));

  if (bestIds.length > 1) {
    return { bestIds, worstIds, needsTiebreak: true, points: {} };
  }

  const bestId = bestIds[0] ?? null;
  const loserSet = new Set(worstIds);
  const points: Record<string, number> = {};
  for (const p of players) {
    if (p.id === bestId) points[p.id] = 10;        // melhor tem prioridade
    else if (loserSet.has(p.id)) points[p.id] = 0;
    else points[p.id] = 2;
  }
  return { bestIds, worstIds, needsTiebreak: false, points };
}

// Pior excluindo o vencedor do melhor: a mesma pessoa nunca e mais pica e pior.
// Conta so os worstId diferentes de excludeId; vazio se ninguem mais recebeu voto de pior.
export function worstIdsExcluding(votes: Vote[], excludeId: string | null): string[] {
  return topIds(countVotes(votes.map((v) => (v.worstId && v.worstId !== excludeId ? v.worstId : null))));
}
