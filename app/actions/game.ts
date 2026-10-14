"use server";
import { createServerClient } from "@/lib/supabase/server";
import { canStart, countdownStartsAt } from "@/lib/game/phase";
import { isDuplicateLater } from "@/lib/game/dedup";
import {
  assertHost, createCountdownRound, beginRoundCore, maybeAdvanceFromFill, maybeTally,
} from "./engine";

export async function startGame(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  const { count } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", input.roomId);
  if (!canStart(count ?? 0)) throw new Error("São necessários ao menos 3 jogadores");

  // rodada 1 comeca na tela de regras
  const { data: round, error } = await supabase
    .from("rounds").insert({ room_id: input.roomId, phase: "regras" }).select().single();
  if (error || !round) throw new Error(error?.message ?? "Falha ao criar rodada");
  await supabase.from("rooms")
    .update({ status: "playing", current_round_id: round.id }).eq("id", input.roomId);
}

// Dono fecha as regras → vai pra contagem sincronizada.
export async function dismissRules(input: { roundId: string; playerId: string }) {
  const supabase = createServerClient();
  const { data: round } = await supabase
    .from("rounds").select("room_id,phase").eq("id", input.roundId).single();
  if (!round || round.phase !== "regras") return;
  await assertHost(supabase, round.room_id, input.playerId);
  const startsAt = countdownStartsAt(Date.now());
  await supabase.from("rounds")
    .update({ phase: "contagem", starts_at: startsAt })
    .eq("id", input.roundId).eq("phase", "regras");
}

// Qualquer cliente dispara ao fim da contagem; idempotente (ver beginRoundCore).
export async function beginRound(input: { roundId: string }) {
  const supabase = createServerClient();
  await beginRoundCore(supabase, input.roundId);
}

export async function nextRound(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  // R6: so avanca se a rodada atual esta em "resultado" (evita 2a rodada em duplo clique)
  const { data: room } = await supabase
    .from("rooms").select("current_round_id,status").eq("id", input.roomId).maybeSingle();
  if (!room?.current_round_id || room.status === "ended") return;
  const { data: cur } = await supabase
    .from("rounds").select("phase").eq("id", room.current_round_id).maybeSingle();
  if (cur?.phase !== "resultado") return;
  await createCountdownRound(supabase, input.roomId);
}

export async function endGame(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  await assertHost(supabase, input.roomId, input.playerId);
  await supabase.from("rooms").update({ status: "ended" }).eq("id", input.roomId);
}

export async function submitAnswer(
  input: { roundId: string; playerId: string; text: string },
): Promise<{ taken: boolean; word?: string }> {
  const supabase = createServerClient();
  const word = input.text.trim();
  // R8: submit tardio (fase ja mudou) nao grava resposta votavel
  const { data: cur } = await supabase.from("rounds").select("phase").eq("id", input.roundId).maybeSingle();
  if (cur?.phase !== "preencher") return { taken: false };
  await supabase.from("answers").upsert(
    { round_id: input.roundId, player_id: input.playerId, text: word, submitted_at: new Date().toISOString() },
    { onConflict: "round_id,player_id" },
  );

  const { data: rows } = await supabase
    .from("answers").select("player_id,text,submitted_at").eq("round_id", input.roundId);
  const all = (rows ?? []).map((a) => ({
    playerId: a.player_id, text: a.text, submittedAt: new Date(a.submitted_at).getTime(),
  }));
  const me = all.find((a) => a.playerId === input.playerId);
  if (me && isDuplicateLater(me, all)) {
    await supabase.from("answers").delete()
      .eq("round_id", input.roundId).eq("player_id", input.playerId);
    return { taken: true, word };
  }

  await maybeAdvanceFromFill(supabase, input.roundId, false);
  return { taken: false };
}

// O cliente avisa que o timer zerou, mas quem decide é o servidor pelo ends_at
// (timeUp=false): uma chamada adiantada (clock skew) é no-op e o cliente repete.
export async function expireFill(input: { roundId: string }) {
  const supabase = createServerClient();
  await maybeAdvanceFromFill(supabase, input.roundId, false);
}

export async function castVote(input: {
  roundId: string; voterId: string; bestId: string | null; worstId: string | null;
}) {
  const supabase = createServerClient();
  const { data: round } = await supabase.from("rounds").select("phase").eq("id", input.roundId).single();
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

// Dono marca uma resposta como repetida: sai dos candidatos de voto (sem punicao).
export async function voidAnswer(input: { roundId: string; hostId: string; targetId: string }) {
  const supabase = createServerClient();
  const { data: round } = await supabase
    .from("rounds").select("room_id,phase").eq("id", input.roundId).single();
  // so durante a votacao principal (a UI so oferece o botao ali)
  if (!round || round.phase !== "votar") return;
  await assertHost(supabase, round.room_id, input.hostId);
  await supabase.from("answers").update({ voided: true })
    .eq("round_id", input.roundId).eq("player_id", input.targetId);
  // revalida apuracao (voto ja dado que apontava pro anulado é ignorado no tally)
  await maybeTally(supabase, input.roundId);
}
