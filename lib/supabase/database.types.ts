export interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  status: "lobby" | "playing" | "ended" | "closed";
  current_round_id: string | null;
  created_at: string;
}
export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  total_points: number;
  connected: boolean;
  joined_at: string;
}
export interface RoundRow {
  id: string;
  room_id: string;
  theme: string | null;
  letter: string | null;
  phase: "regras" | "contagem" | "preencher" | "votar" | "desempate" | "resultado";
  tiebreak_candidates: string[];
  tiebreak_kind: "best" | "worst" | null;
  best_winner: string | null;
  worst_loser: string | null;
  round_scores: Record<string, number>;
  starts_at: string | null;
  ends_at: string | null;
  started_at: string;
}
export interface AnswerRow {
  id: string;
  round_id: string;
  player_id: string;
  text: string;
  voided: boolean;
  submitted_at: string;
}
export interface VoteRow {
  id: string;
  round_id: string;
  voter_id: string;
  best_id: string | null;
  worst_id: string | null;
  is_tiebreak: boolean;
}
