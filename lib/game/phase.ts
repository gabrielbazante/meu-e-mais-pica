export const MIN_PLAYERS = 3;
export const FILL_SECONDS = 60;
export const COUNTDOWN_SECONDS = 3;
// Folga antes do 3: o starts_at é calculado antes de gravar a rodada, e a
// rodada ainda precisa chegar (Realtime + load()) a todos os clientes.
export const COUNTDOWN_LEAD_MS = 2500;

export function countdownStartsAt(nowMs: number): string {
  return new Date(nowMs + COUNTDOWN_LEAD_MS + COUNTDOWN_SECONDS * 1000).toISOString();
}

export type CountdownView =
  | { kind: "prep" }
  | { kind: "number"; n: number }
  | { kind: "go" };

export function countdownView(startsAtMs: number, nowMs: number): CountdownView {
  const left = Math.max(0, Math.ceil((startsAtMs - nowMs) / 1000));
  if (left === 0) return { kind: "go" };
  if (left > COUNTDOWN_SECONDS) return { kind: "prep" };
  return { kind: "number", n: left };
}

export function canStart(playerCount: number): boolean {
  return playerCount >= MIN_PLAYERS;
}

export function fillPhaseComplete(
  submittedCount: number,
  playerCount: number,
  timeUp: boolean,
): boolean {
  return timeUp || submittedCount >= playerCount;
}

export function votePhaseComplete(voterCount: number, playerCount: number): boolean {
  return voterCount >= playerCount;
}
