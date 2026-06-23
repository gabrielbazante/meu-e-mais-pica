"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Ranking } from "./Ranking";
import { nextRound, endGame } from "@/app/actions/game";
import type { AnswerRow, PlayerRow, RoundRow, VoteRow } from "@/lib/supabase/database.types";

export function Result({ room, round, players, answers, votes, meId, isHost }: {
  room: { id: string }; round: RoundRow; players: PlayerRow[]; answers: AnswerRow[]; votes: VoteRow[]; meId: string; isHost: boolean;
}) {
  // recomputa o "mais pica" da rodada para o destaque (a partir dos votos não-desempate)
  const best = topBest(votes, round, answers);
  const bestAns = answers.find((a) => a.player_id === best);
  const bestName = players.find((p) => p.id === best)?.name ?? "?";
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => { const t = setTimeout(() => setShowRanking(true), 2200); return () => clearTimeout(t); }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      {!showRanking ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <Confetti />
          <p className="text-lg font-bold opacity-70">O mais pica da rodada</p>
          <p className="text-5xl">🔥</p>
          <p className="font-display text-4xl font-black">{bestName}</p>
          <Card className="!bg-party-teal text-white">{bestAns?.text || "—"}</Card>
        </div>
      ) : (
        <>
          <h2 className="text-center text-2xl font-black">Ranking 🏆</h2>
          <Ranking players={players} />
          {isHost ? (
            <div className="mt-2 flex flex-col gap-2">
              <Button onClick={() => nextRound({ roomId: room.id, playerId: meId })}>Próxima rodada ▶</Button>
              <Button className="!bg-ink" onClick={() => endGame({ roomId: room.id, playerId: meId })}>Encerrar partida</Button>
            </div>
          ) : (
            <p className="text-center font-bold opacity-70">Aguardando o dono…</p>
          )}
        </>
      )}
    </main>
  );
}

function topBest(votes: VoteRow[], round: RoundRow, answers: AnswerRow[]): string | null {
  const counts: Record<string, number> = {};
  for (const v of votes.filter((v) => !v.is_tiebreak)) if (v.best_id) counts[v.best_id] = (counts[v.best_id] ?? 0) + 1;
  const max = Math.max(0, ...Object.values(counts));
  const top = Object.keys(counts).filter((id) => counts[id] === max);
  if (top.length === 1) return top[0];
  // se houve desempate, o vencedor é quem realmente recebeu 10 — aproxima por submittedAt
  const tb = votes.filter((v) => v.is_tiebreak);
  if (tb.length) {
    const tcounts: Record<string, number> = {};
    for (const v of tb) if (v.best_id) tcounts[v.best_id] = (tcounts[v.best_id] ?? 0) + 1;
    const tmax = Math.max(0, ...Object.values(tcounts));
    const ttop = Object.keys(tcounts).filter((id) => tcounts[id] === tmax);
    if (ttop.length === 1) return ttop[0];
    return ttop.sort((a, b) => {
      const sa = answers.find((x) => x.player_id === a)?.submitted_at ?? "";
      const sb = answers.find((x) => x.player_id === b)?.submitted_at ?? "";
      return sa.localeCompare(sb);
    })[0] ?? null;
  }
  return top[0] ?? null;
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
