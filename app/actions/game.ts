"use server";
import { createServerClient } from "@/lib/supabase/server";
import { drawRound } from "@/lib/game/draw";
import { tallyRound } from "@/lib/game/tally";
import { resolveTiebreak } from "@/lib/game/tiebreak";
import { fillPhaseComplete, votePhaseComplete, canStart, FILL_SECONDS } from "@/lib/game/phase";
import type { Player, Vote } from "@/lib/game/types";
import type { RoundRow } from "@/lib/supabase/database.types";

type SB = ReturnType<typeof createServerClient>;

async function assertHost(supabase: SB, roomId: string, playerId: string) {
  const { data: room } = await supabase.from("rooms").select("host_id").eq("id", roomId).single();
  if (!room || room.host_id !== playerId) throw new Error("Só o dono da sala pode fazer isso");
}

async function startRound(supabase: SB, roomId: string) {
  const { data: prev } = await supabase
    .from("rounds").select("theme").eq("room_id", roomId)
    .order("started_at", { ascending: false }).limit(1).maybeSingle();
  const { theme, letter } = drawRound({ prevTheme: prev?.theme });
  const endsAt = new Date(Date.now() + FILL_SECONDS * 1000).toISOString();

  const { data: round } = await supabase
    .from("rounds")
    .insert({ room_id: roomId, theme, letter, phase: "preencher", ends_at: endsAt })
    .select().single();
  await supabase.from("rooms")
    .update({ status: "playing", current_round_id: round!.id }).eq("id", roomId);
}

export async function startGame(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  const { count } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", input.roomId);
  if (!canStart(count ?? 0)) throw new Error("São necessários ao menos 3 jogadores");
  await startRound(supabase, input.roomId);
}

export async function nextRound(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  await startRound(supabase, input.roomId);
}

export async function endGame(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  await supabase.from("rooms").update({ status: "ended" }).eq("id", input.roomId);
}

export async function submitAnswer(input: { roundId: string; playerId: string; text: string }) {
  const supabase = createServerClient();
  await supabase.from("answers").upsert(
    { round_id: input.roundId, player_id: input.playerId, text: input.text.trim(), submitted_at: new Date().toISOString() },
    { onConflict: "round_id,player_id" },
  );
  await maybeAdvanceFromFill(supabase, input.roundId, false);
}

export async function expireFill(input: { roundId: string }) {
  const supabase = createServerClient();
  await maybeAdvanceFromFill(supabase, input.roundId, true);
}

async function maybeAdvanceFromFill(supabase: SB, roundId: string, timeUp: boolean) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round || round.phase !== "preencher") return;
  const expired = timeUp || (round.ends_at != null && new Date(round.ends_at) <= new Date());
  const { count: playerCount } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", round.room_id);
  const { count: answeredCount } = await supabase
    .from("answers").select("id", { count: "exact", head: true }).eq("round_id", roundId);

  if (fillPhaseComplete(answeredCount ?? 0, playerCount ?? 0, expired)) {
    const { data: players } = await supabase.from("players").select("id").eq("room_id", round.room_id);
    const { data: answers } = await supabase.from("answers").select("player_id").eq("round_id", roundId);
    const answered = new Set((answers ?? []).map((a) => a.player_id));
    const missing = (players ?? []).filter((p) => !answered.has(p.id))
      .map((p) => ({ round_id: roundId, player_id: p.id, text: "" }));
    if (missing.length) await supabase.from("answers").insert(missing);
    await supabase.from("rounds").update({ phase: "votar" }).eq("id", roundId);
  }
}

export async function castVote(input: {
  roundId: string; voterId: string; bestId: string | null; worstId: string | null;
}) {
  const supabase = createServerClient();
  const { data: round } = await supabase.from("rounds").select("*").eq("id", input.roundId).single<RoundRow>();
  if (!round) return;
  const isTiebreak = round.phase === "desempate";
  await supabase.from("votes").upsert(
    {
      round_id: input.roundId, voter_id: input.voterId,
      best_id: input.bestId, worst_id: input.worstId, is_tiebreak: isTiebreak,
    },
    { onConflict: "round_id,voter_id,is_tiebreak" },
  );
  await maybeTally(supabase, input.roundId);
}

async function maybeTally(supabase: SB, roundId: string) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round) return;
  const isTiebreak = round.phase === "desempate";
  if (round.phase !== "votar" && round.phase !== "desempate") return;

  const { count: playerCount } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", round.room_id);
  const { data: voteRows } = await supabase
    .from("votes").select("*").eq("round_id", roundId).eq("is_tiebreak", isTiebreak);
  if (!votePhaseComplete(voteRows?.length ?? 0, playerCount ?? 0)) return;

  const { data: playerRows } = await supabase
    .from("players").select("id,name,total_points").eq("room_id", round.room_id);
  const players: Player[] = (playerRows ?? []).map((p) => ({
    id: p.id, name: p.name, totalPoints: p.total_points,
  }));

  if (isTiebreak) {
    const { data: answers } = await supabase
      .from("answers").select("player_id,submitted_at").eq("round_id", roundId);
    const submittedAt: Record<string, number> = {};
    for (const a of answers ?? []) submittedAt[a.player_id] = new Date(a.submitted_at).getTime();
    const winner = resolveTiebreak(
      round.tiebreak_candidates,
      (voteRows ?? []).map((v) => v.best_id),
      submittedAt,
    );
    const { data: origVotes } = await supabase
      .from("votes").select("*").eq("round_id", roundId).eq("is_tiebreak", false);
    const orig: Vote[] = (origVotes ?? []).map((v) => ({ voterId: v.voter_id, bestId: v.best_id, worstId: v.worst_id }));
    const base = tallyRound(players, orig);
    await applyPoints(supabase, players, winner, base.worstIds);
    await supabase.from("rounds").update({ phase: "resultado" }).eq("id", roundId);
    return;
  }

  const votes: Vote[] = (voteRows ?? []).map((v) => ({ voterId: v.voter_id, bestId: v.best_id, worstId: v.worst_id }));
  const result = tallyRound(players, votes);
  if (result.needsTiebreak) {
    await supabase.from("rounds")
      .update({ phase: "desempate", tiebreak_candidates: result.bestIds }).eq("id", roundId);
    return;
  }
  await applyPoints(supabase, players, result.bestIds[0] ?? null, result.worstIds);
  await supabase.from("rounds").update({ phase: "resultado" }).eq("id", roundId);
}

async function applyPoints(
  supabase: SB, players: Player[], bestId: string | null, worstIds: string[],
) {
  const loser = new Set(worstIds);
  for (const p of players) {
    const delta = p.id === bestId ? 10 : loser.has(p.id) ? 0 : 2;
    if (delta !== 0) {
      await supabase.from("players")
        .update({ total_points: p.totalPoints + delta }).eq("id", p.id);
    }
  }
}
