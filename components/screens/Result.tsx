"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogoTitle } from "@/components/ui/LogoTitle";
import { Confetti } from "@/components/ui/Confetti";
import { ManagePlayers } from "@/components/ui/ManagePlayers";
import { Flame, Play, Star, Tomato, Trophy } from "@/components/icons";
import { Ranking } from "./Ranking";
import { nextRound, endGame } from "@/app/actions/game";
import type { AnswerRow, PlayerRow, RoundRow, VoteRow } from "@/lib/supabase/database.types";

export function Result({ room, round, players, answers, votes, meId, isHost }: {
  room: { id: string }; round: RoundRow; players: PlayerRow[]; answers: AnswerRow[]; votes: VoteRow[]; meId: string; isHost: boolean;
}) {
  const [showRanking, setShowRanking] = useState(false);
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }
  useEffect(() => { const t = setTimeout(() => setShowRanking(true), 2600); return () => clearTimeout(t); }, []);

  const mainVotes = votes.filter((v) => !v.is_tiebreak);
  const countFor = (id: string | null, field: "best_id" | "worst_id") =>
    id ? mainVotes.filter((v) => v[field] === id).length : 0;
  const votesLabel = (n: number) => `${n} ${n === 1 ? "voto" : "votos"}`;

  const bestId = round.best_winner;
  const worstId = round.worst_loser;
  const nameOf = (id: string | null) => players.find((p) => p.id === id)?.name ?? "—";
  const textOf = (id: string | null) => answers.find((a) => a.player_id === id)?.text ?? "—";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      {isHost && (
        <div className="flex justify-end">
          <ManagePlayers roomId={room.id} players={players} meId={meId} hostId={meId} />
        </div>
      )}
      {!showRanking ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <Confetti variant="party" />
          <section className="flex w-full flex-col items-center gap-2">
            <Flame size={52} />
            <LogoTitle as="h2" size="md">O mais pica</LogoTitle>
            <p className="break-words font-display text-3xl font-extrabold">{nameOf(bestId)}</p>
            <Card className="w-full break-words !bg-logo-pink font-bold text-white">
              {textOf(bestId)} <span className="opacity-85">· {votesLabel(countFor(bestId, "best_id"))}</span>
            </Card>
          </section>
          <section className="flex w-full flex-col items-center gap-2">
            {worstId == null ? (
              <>
                <Star size={44} />
                <p className="font-display text-xl font-extrabold">Sem pior nesta rodada</p>
              </>
            ) : (
              <>
                <Tomato size={46} />
                <LogoTitle as="h2" size="sm">O pior</LogoTitle>
                <p className="break-words font-display text-2xl font-extrabold">{nameOf(worstId)}</p>
                <Card className="w-full break-words !bg-logo-purple font-bold text-white">
                  {textOf(worstId)} <span className="opacity-85">· {votesLabel(countFor(worstId, "worst_id"))}</span>
                </Card>
              </>
            )}
          </section>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2">
            <Trophy size={36} />
            <LogoTitle as="h2" size="md">Ranking</LogoTitle>
          </div>
          <Ranking players={players} deltas={round.round_scores} />
          {isHost ? (
            <div className="mt-2 flex flex-col gap-2">
              <Button disabled={busy} icon={<Play size={20} />} onClick={() => run(() => nextRound({ roomId: room.id, playerId: meId }))}>Próxima rodada</Button>
              <Button className="!bg-ink" disabled={busy} onClick={() => run(() => endGame({ roomId: room.id, playerId: meId }))}>Encerrar partida</Button>
            </div>
          ) : (
            <p className="text-center font-bold opacity-70">Aguardando o dono…</p>
          )}
        </>
      )}
    </main>
  );
}
