export interface RoomRow {
  id: string;
  code: string;
  host_id: string;
  status: "lobby" | "playing" | "ended";
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
  theme: string;
  letter: string;
  phase: "preencher" | "votar" | "desempate" | "resultado";
  tiebreak_candidates: string[];
  ends_at: string | null;
  started_at: string;
}
export interface AnswerRow {
  id: string;
  round_id: string;
  player_id: string;
  text: string;
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
