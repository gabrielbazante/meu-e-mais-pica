import { createServerClient } from "@/lib/supabase/server";
import { drawRound } from "@/lib/game/draw";
import { FILL_SECONDS, COUNTDOWN_SECONDS } from "@/lib/game/phase";
import { roundDeltas } from "@/lib/game/scoring";
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

// Finaliza a rodada: calcula deltas, aplica aos totais, grava round_scores e vai pra resultado.
export async function finalizeRound(
  supabase: SB, round: RoundRow, bestId: string | null = null, worstId: string | null = null,
) {
  const { data: playerRows } = await supabase
    .from("players").select("id,total_points").eq("room_id", round.room_id);
  const { data: answerRows } = await supabase
    .from("answers").select("player_id,text").eq("round_id", round.id);

  const playerIds = (playerRows ?? []).map((p) => p.id);
  const currentTotals: Record<string, number> = {};
  for (const p of playerRows ?? []) currentTotals[p.id] = p.total_points;
  // respondentes = tem linha com texto nao-vazio (inclui voided → +2)
  const answeredIds = (answerRows ?? []).filter((a) => a.text.trim() !== "").map((a) => a.player_id);

  // borda <2: se nao veio melhor explicito e so ha um respondente, ele leva +10
  let effectiveBest = bestId;
  if (effectiveBest == null && answeredIds.length === 1) effectiveBest = answeredIds[0];

  const deltas = roundDeltas({ playerIds, answeredIds, bestId: effectiveBest, worstId, currentTotals });

  // Claim atomico da transicao: o UPDATE condicional na fase atual garante que apenas
  // um chamador concorrente aplique pontos. Quem perde a corrida nao toca nos players.
  const { data: claimed } = await supabase.from("rounds").update({
    phase: "resultado",
    round_scores: deltas,
    best_winner: effectiveBest,
    worst_loser: worstId,
  }).eq("id", round.id).eq("phase", round.phase).select("id");
  if (!claimed || claimed.length === 0) return;

  for (const p of playerRows ?? []) {
    const d = deltas[p.id] ?? 0;
    if (d !== 0) {
      await supabase.from("players").update({ total_points: p.total_points + d }).eq("id", p.id);
    }
  }
}
