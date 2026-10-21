// Pode enviar o voto? "eligibleCount" = respostas votaveis que nao sao do proprio votante.
// Mais pica e pior precisam ser diferentes; com so 1 opcao, so da para votar no mais pica
// (pior vai null); sem opcao, envia nulos para nao travar a rodada.
export function canSendVote(p: {
  tiebreak: boolean; eligibleCount: number; best: boolean; worst: boolean;
}): boolean {
  if (p.tiebreak) return p.best;
  if (p.eligibleCount === 0) return true;
  if (p.eligibleCount === 1) return p.best;
  return p.best && p.worst;
}
