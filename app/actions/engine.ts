import { createServerClient } from "@/lib/supabase/server";
import { drawRound } from "@/lib/game/draw";
import { FILL_SECONDS, countdownStartsAt, fillPhaseComplete, votePhaseComplete } from "@/lib/game/phase";
import { roundDeltas } from "@/lib/game/scoring";
import { tallyRound, worstIdsExcluding } from "@/lib/game/tally";
import { aliveCandidates, resolveTiebreak } from "@/lib/game/tiebreak";
import type { Player, Vote } from "@/lib/game/types";
import type { RoundRow } from "@/lib/supabase/database.types";

export type SB = ReturnType<typeof createServerClient>;

export async function assertHost(supabase: SB, roomId: string, playerId: string) {
  const { data: room } = await supabase.from("rooms").select("host_id").eq("id", roomId).single();
  if (!room || room.host_id !== playerId) throw new Error("Só o dono da sala pode fazer isso");
}

// Cria a próxima rodada já em contagem (tema/letra ficam null até o fim da contagem).
export async function createCountdownRound(supabase: SB, roomId: string) {
  const startsAt = countdownStartsAt(Date.now());
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
    .from("answers").select("player_id,text,voided").eq("round_id", round.id);

  const playerIds = (playerRows ?? []).map((p) => p.id);
  const currentTotals: Record<string, number> = {};
  for (const p of playerRows ?? []) currentTotals[p.id] = p.total_points;
  // respondentes = tem linha com texto nao-vazio (inclui voided → +2)
  const answeredIds = (answerRows ?? []).filter((a) => a.text.trim() !== "").map((a) => a.player_id);

  // borda <2: se nao veio melhor explicito e so ha um respondente valido (nao anulado), ele leva +10
  const validIds = (answerRows ?? [])
    .filter((a) => a.text.trim() !== "" && !a.voided).map((a) => a.player_id);
  let effectiveBest = bestId;
  if (effectiveBest == null && validIds.length === 1) effectiveBest = validIds[0];

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

// Avanca de "preencher" para "votar" quando todos responderam ou o tempo acabou.
// NAO insere respostas em branco: quem nao enviou simplesmente nao tem linha.
// Borda: com menos de 2 candidatos votaveis, pula a votacao e finaliza direto.
export async function maybeAdvanceFromFill(supabase: SB, roundId: string, timeUp: boolean) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round || round.phase !== "preencher") return;
  const expired = timeUp || (round.ends_at != null && new Date(round.ends_at) <= new Date());

  const { count: playerCount } = await supabase
    .from("players").select("id", { count: "exact", head: true }).eq("room_id", round.room_id);
  const { count: answeredCount } = await supabase
    .from("answers").select("id", { count: "exact", head: true }).eq("round_id", roundId);
  if (!fillPhaseComplete(answeredCount ?? 0, playerCount ?? 0, expired)) return;

  // candidatos de voto = resposta nao-vazia e nao anulada
  const { data: answerRows } = await supabase
    .from("answers").select("player_id,text,voided").eq("round_id", roundId);
  const votable = (answerRows ?? []).filter((a) => a.text.trim() !== "" && !a.voided);

  if (votable.length < 2) {
    await finalizeRound(supabase, round);
    return;
  }
  await supabase.from("rounds").update({ phase: "votar" }).eq("id", roundId).eq("phase", "preencher");
}

// Apura votos. Em "votar": abre desempate do melhor (se empatar), senao do pior
// (guardando best_winner), senao finaliza. Em "desempate": resolve conforme
// tiebreak_kind, encadeando best→worst quando o pior ainda empata.
// Votos que apontam para respostas anuladas sao nulificados antes do tally.
export async function maybeTally(supabase: SB, roundId: string) {
  const { data: round } = await supabase.from("rounds").select("*").eq("id", roundId).single<RoundRow>();
  if (!round) return;
  if (round.phase !== "votar" && round.phase !== "desempate") return;
  const isTiebreak = round.phase === "desempate";

  const { data: answerData } = await supabase
    .from("answers").select("player_id,text,voided,submitted_at").eq("round_id", roundId);
  const answerRows = answerData ?? [];
  const voided = new Set(answerRows.filter((a) => a.voided).map((a) => a.player_id));
  const nullifyVoided = (id: string | null) => (id && voided.has(id) ? null : id);
  // so quem ainda tem resposta valida (expulsos perdem a linha por cascade)
  const alive = (ids: string[]) => aliveCandidates(ids, answerRows);

  // Guarda: com menos de 2 candidatos votaveis (ex.: anulacoes durante "votar") ninguem
  // consegue completar a votacao (nao se vota em si mesmo); finaliza direto.
  if (!isTiebreak) {
    const votable = answerRows.filter((a) => a.text.trim() !== "" && !a.voided);
    if (votable.length < 2) {
      await finalizeRound(supabase, round, votable[0]?.player_id ?? null, null);
      return;
    }
  }

  const { data: playerRows } = await supabase
    .from("players").select("id,name,total_points").eq("room_id", round.room_id);
  const players: Player[] = (playerRows ?? []).map((p) => ({
    id: p.id, name: p.name, totalPoints: p.total_points,
  }));

  // recomputa o pior a partir dos votos principais (usado so no desempate), excluindo
  // o vencedor do melhor: a mesma pessoa nunca e mais pica e pior.
  const baseWorstIds = async (bestId: string | null) => {
    const { data: origVoteRows } = await supabase
      .from("votes").select("*").eq("round_id", roundId).eq("is_tiebreak", false);
    const origVotes: Vote[] = (origVoteRows ?? []).map((v) => ({
      voterId: v.voter_id, bestId: nullifyVoided(v.best_id), worstId: nullifyVoided(v.worst_id),
    }));
    return alive(worstIdsExcluding(origVotes, bestId));
  };

  // Melhor ja resolvido no desempate: encadeia para o desempate do pior (se empatar)
  // ou finaliza. Claim primeiro: so quem vencer a transicao best→worst apaga os votos.
  const afterBestResolved = async (bestId: string | null) => {
    const worstIds = await baseWorstIds(bestId);
    if (worstIds.length > 1) {
      const { data: claimed } = await supabase.from("rounds").update({
        tiebreak_kind: "worst", tiebreak_candidates: worstIds, best_winner: bestId,
      }).eq("id", roundId).eq("phase", "desempate").eq("tiebreak_kind", "best").select("id");
      if (claimed && claimed.length > 0) {
        await supabase.from("votes").delete().eq("round_id", roundId).eq("is_tiebreak", true);
      }
      return;
    }
    await finalizeRound(supabase, round, bestId, worstIds[0] ?? null);
  };

  // Desempate com menos de 2 candidatos vivos (ex.: um empatado foi expulso): o restante
  // nao pode votar em si mesmo e a votacao nunca fecharia; resolve direto.
  if (isTiebreak) {
    const cands = alive(round.tiebreak_candidates);
    if (cands.length < 2) {
      const resolved = cands[0] ?? null;
      if (round.tiebreak_kind === "best") await afterBestResolved(resolved);
      else await finalizeRound(supabase, round, round.best_winner, resolved);
      return;
    }
  }

  const { data: voteRows } = await supabase
    .from("votes").select("*").eq("round_id", roundId).eq("is_tiebreak", isTiebreak);
  if (!votePhaseComplete(voteRows?.length ?? 0, players.length)) return;

  // --- votos principais ---
  if (!isTiebreak) {
    const votes: Vote[] = (voteRows ?? []).map((v) => ({
      voterId: v.voter_id, bestId: nullifyVoided(v.best_id), worstId: nullifyVoided(v.worst_id),
    }));
    const result = tallyRound(players, votes);

    if (result.bestIds.length > 1) {
      await supabase.from("rounds").update({
        phase: "desempate", tiebreak_kind: "best", tiebreak_candidates: result.bestIds,
      }).eq("id", roundId).eq("phase", "votar");
      return;
    }
    const bestId = result.bestIds[0] ?? null;
    const worstIds = worstIdsExcluding(votes, bestId);
    if (worstIds.length > 1) {
      await supabase.from("rounds").update({
        phase: "desempate", tiebreak_kind: "worst", tiebreak_candidates: worstIds, best_winner: bestId,
      }).eq("id", roundId).eq("phase", "votar");
      return;
    }
    await finalizeRound(supabase, round, bestId, worstIds[0] ?? null);
    return;
  }

  // --- votos de desempate (campo best_id = alvo escolhido) ---
  const submittedAt: Record<string, number> = {};
  for (const a of answerRows) submittedAt[a.player_id] = new Date(a.submitted_at).getTime();
  const tbBest = (voteRows ?? []).map((v) => nullifyVoided(v.best_id));
  const cands = alive(round.tiebreak_candidates);
  // melhor: empate persistente cai em quem respondeu primeiro; pior: em quem respondeu por ultimo
  const resolved = resolveTiebreak(cands, tbBest, submittedAt, round.tiebreak_kind === "worst" ? "latest" : "earliest");

  if (round.tiebreak_kind === "best") {
    await afterBestResolved(resolved);
    return;
  }
  // tiebreak_kind === "worst"
  await finalizeRound(supabase, round, round.best_winner, resolved);
}
