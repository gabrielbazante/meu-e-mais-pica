export const MIN_PLAYERS = 3;
export const FILL_SECONDS = 60;
export const COUNTDOWN_SECONDS = 3;

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
