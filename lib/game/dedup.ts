import { normalizeAnswer } from "./normalize";

export interface AnswerLite {
  playerId: string;
  text: string;
  submittedAt: number; // epoch ms
}

// Decide se a resposta de `me` deve ser recusada por já existir outra igual
// (normalizada) confirmada ANTES por outro jogador. Empate exato de tempo é
// desempatado por playerId, de forma determinística. Respostas em branco nunca
// são consideradas duplicatas.
export function isDuplicateLater(me: AnswerLite, all: AnswerLite[]): boolean {
  const norm = normalizeAnswer(me.text);
  if (norm === "") return false;
  return all.some(
    (a) =>
      a.playerId !== me.playerId &&
      normalizeAnswer(a.text) === norm &&
      (a.submittedAt < me.submittedAt ||
        (a.submittedAt === me.submittedAt && a.playerId < me.playerId)),
  );
}
