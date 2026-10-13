import { createServerClient } from "@/lib/supabase/server";
import { drawRound } from "@/lib/game/draw";
import { FILL_SECONDS, COUNTDOWN_SECONDS } from "@/lib/game/phase";
import type { RoundRow } from "@/lib/supabase/database.types";

export type SB = ReturnType<typeof createServerClient>;

export async function assertHost(supabase: SB, roomId: string, playerId: string) {
  const { data: room } = await supabase.from("rooms").select("host_id").eq("id", roomId).single();
  if (!room || room.host_id !== playerId) throw new Error("Só o dono da sala pode fazer isso");
}

// Cria a próxima rodada já em contagem (tema/letra ficam null até o fim da contagem).
export async function createCountdownRound(supabase: SB, roomId: string) {
  const startsAt = new Date(Date.now() + COUNTDOWN_SECONDS * 1000).toISOString();
  const { data: round, error } = await supabase
    .from("rounds")
    .insert({ room_id: roomId, phase: "contagem", starts_at: startsAt })
    .select().single();
  if (error || !round) throw new Error(error?.message ?? "Falha ao criar rodada");
  await supabase.from("rooms")
    .update({ status: "playing", current_round_id: round.id }).eq("id", roomId);
}

// Idempotente: so sorteia tema+letra e abre "preencher" quando a contagem terminou.
// O UPDATE condicional (.eq phase='contagem') garante um unico vencedor sob corrida
// (Postgres re-avalia o predicado apos o lock da linha).
export async function beginRoundCore(supabase: SB, roundId: string) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round || round.phase !== "contagem") return;
  if (!round.starts_at || new Date(round.starts_at) > new Date()) return;

  const { data: prev } = await supabase
    .from("rounds").select("theme").eq("room_id", round.room_id)
    .not("theme", "is", null)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();

  const { theme, letter } = drawRound({ prevTheme: prev?.theme ?? undefined });
  const endsAt = new Date(Date.now() + FILL_SECONDS * 1000).toISOString();
  await supabase.from("rounds")
    .update({ theme, letter, phase: "preencher", ends_at: endsAt })
    .eq("id", roundId).eq("phase", "contagem");
}
