export type Phase = "preencher" | "votar" | "desempate" | "resultado";
export type RoomStatus = "lobby" | "playing" | "ended";

export interface Player {
  id: string;
  name: string;
  totalPoints: number;
}

export interface Answer {
  playerId: string;
  text: string;
  submittedAt: number; // epoch ms
}

export interface Vote {
  voterId: string;
  bestId: string | null;
  worstId: string | null;
}
