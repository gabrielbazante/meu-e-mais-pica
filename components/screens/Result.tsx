"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ManagePlayers } from "@/components/ui/ManagePlayers";
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
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <Confetti />
          <div>
            <p className="text-lg font-bold opacity-70">O mais pica 🔥</p>
            <p className="font-display text-3xl font-black">{nameOf(bestId)}</p>
            <Card className="!bg-party-teal mt-1 text-white">{textOf(bestId)} <span className="opacity-80">({countFor(bestId, "best_id")} {countFor(bestId, "best_id") === 1 ? "voto" : "votos"})</span></Card>
          </div>
          <div>
            <p className="text-lg font-bold opacity-70">O pior 💩</p>
            <p className="font-display text-2xl font-black">{nameOf(worstId)}</p>
            <Card className="!bg-party-red mt-1 text-white">{textOf(worstId)} <span className="opacity-80">({countFor(worstId, "worst_id")} {countFor(worstId, "worst_id") === 1 ? "voto" : "votos"})</span></Card>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-center text-2xl font-black">Ranking 🏆</h2>
          <Ranking players={players} deltas={round.round_scores} />
          {isHost ? (
            <div className="mt-2 flex flex-col gap-2">
              <Button disabled={busy} onClick={() => run(() => nextRound({ roomId: room.id, playerId: meId }))}>Próxima rodada ▶</Button>
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

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} style={{
          position: "absolute", left: `${Math.random() * 100}%`, top: "-10%",
          fontSize: 18 + Math.random() * 14,
          animation: `fall ${1.5 + Math.random() * 1.5}s linear ${Math.random()}s forwards`,
        }}>{["🎉", "✨", "🔥", "⭐"][i % 4]}</span>
      ))}
      <style>{`@keyframes fall{to{transform:translateY(110vh) rotate(360deg);opacity:.2}}`}</style>
    </div>
  );
}
