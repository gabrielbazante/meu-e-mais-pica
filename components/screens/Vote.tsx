"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import { castVote } from "@/app/actions/game";
import type { AnswerRow, PlayerRow, RoundRow, VoteRow } from "@/lib/supabase/database.types";

export function Vote({ round, players, answers, votes, meId }: {
  round: RoundRow; players: PlayerRow[]; answers: AnswerRow[]; votes: VoteRow[]; meId: string;
}) {
  const tiebreak = round.phase === "desempate";
  const myVote = votes.find((v) => v.voter_id === meId && v.is_tiebreak === tiebreak);
  const [best, setBest] = useState<string | null>(myVote?.best_id ?? null);
  const [worst, setWorst] = useState<string | null>(myVote?.worst_id ?? null);
  const [sent, setSent] = useState(!!myVote);

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
  const joinIndex = colorIndexByJoin(players);
  const candidates = tiebreak
    ? answers.filter((a) => round.tiebreak_candidates.includes(a.player_id))
    : answers;
  const canSend = tiebreak ? !!best : !!best && !!worst;
  const votedCount = votes.filter((v) => v.is_tiebreak === tiebreak).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-5">
      <Card className="text-center !py-2">
        <p className="font-black">{tiebreak ? "🔥 DESEMPATE — vote no melhor" : "Vote no mais pica e no pior"}</p>
        <p className="text-sm opacity-70">{round.theme} · letra {round.letter}</p>
      </Card>

      {candidates.map((a) => {
        const self = a.player_id === meId;
        return (
          <Card key={a.player_id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BlockAvatar seed={a.player_id} size={32} colorIndex={joinIndex.get(a.player_id)} />
              <span className="font-extrabold">{nameOf(a.player_id)}{self && " (você)"}</span>
            </div>
            <p className="rounded-lg bg-party-yellow/40 px-3 py-2 font-bold">{a.text || <em className="opacity-50">em branco</em>}</p>
            {!sent && (
              <div className="flex gap-2">
                <button disabled={self}
                  className={"flex-1 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (best === a.player_id ? "bg-party-teal text-white" : "bg-white")}
                  onClick={() => setBest(a.player_id)}>Mais pica 🔥</button>
                {!tiebreak && (
                  <button disabled={self}
                    className={"flex-1 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (worst === a.player_id ? "bg-party-red text-white" : "bg-white")}
                    onClick={() => setWorst(a.player_id)}>Pior 💩</button>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {!sent ? (
        <Button disabled={!canSend}
          onClick={async () => { setSent(true); await castVote({ roundId: round.id, voterId: meId, bestId: best, worstId: tiebreak ? null : worst }); }}>
          Confirmar voto
        </Button>
      ) : (
        <p className="text-center font-bold opacity-70">{votedCount}/{players.length} votaram</p>
      )}
    </main>
  );
}
