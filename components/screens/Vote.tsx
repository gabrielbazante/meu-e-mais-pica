"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ManagePlayers } from "@/components/ui/ManagePlayers";
import { VotersList } from "@/components/ui/VotersList";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import { castVote, voidAnswer } from "@/app/actions/game";
import { possibleDuplicates } from "@/lib/game/similarity";
import type { AnswerRow, PlayerRow, RoundRow, VoteRow } from "@/lib/supabase/database.types";

export function Vote({ round, players, answers, votes, meId, isHost, roomId }: {
  round: RoundRow; players: PlayerRow[]; answers: AnswerRow[]; votes: VoteRow[];
  meId: string; isHost: boolean; roomId: string;
}) {
  const tiebreak = round.phase === "desempate";
  const kind = round.tiebreak_kind; // 'best' | 'worst' | null
  const myVote = votes.find((v) => v.voter_id === meId && v.is_tiebreak === tiebreak);
  const [best, setBest] = useState<string | null>(myVote?.best_id ?? null);
  const [worst, setWorst] = useState<string | null>(myVote?.worst_id ?? null);
  const [sent, setSent] = useState(!!myVote);

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
  const joinIndex = colorIndexByJoin(players);

  // candidatos: respostas nao-vazias e nao anuladas; no desempate, so os empatados
  const live = answers.filter((a) => a.text.trim() !== "" && !a.voided);
  const candidates = tiebreak ? live.filter((a) => round.tiebreak_candidates.includes(a.player_id)) : live;

  const dupFlags = possibleDuplicates(candidates.map((a) => ({ playerId: a.player_id, text: a.text })));

  const canSend = tiebreak ? !!best : !!best && !!worst;
  const header = tiebreak
    ? (kind === "worst" ? "💩 DESEMPATE — vote no PIOR" : "🔥 DESEMPATE — vote no MELHOR")
    : "Vote no mais pica e no pior";
  const pickLabel = tiebreak && kind === "worst" ? "Pior 💩" : "Mais pica 🔥";
  const pickColor = tiebreak && kind === "worst" ? "bg-party-red text-white" : "bg-party-teal text-white";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-5">
      {isHost && (
        <div className="flex justify-end">
          <ManagePlayers roomId={roomId} players={players} meId={meId} hostId={meId} />
        </div>
      )}
      <Card className="text-center !py-2">
        <p className="font-black">{header}</p>
        <p className="text-sm opacity-70">{round.theme} · letra {round.letter}</p>
      </Card>

      {candidates.map((a) => {
        const self = a.player_id === meId;
        const flagged = dupFlags.has(a.player_id);
        return (
          <Card key={a.player_id} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BlockAvatar seed={a.player_id} size={32} colorIndex={joinIndex.get(a.player_id)} />
              <span className="font-extrabold">{nameOf(a.player_id)}{self && " (você)"}</span>
              {flagged && <span className="ml-auto text-xs font-bold text-party-red">parece repetida?</span>}
            </div>
            <p className="rounded-lg bg-party-yellow/40 px-3 py-2 font-bold">{a.text}</p>

            {isHost && !tiebreak && !self && (
              <button
                className="self-start rounded-lg border-3 border-ink bg-white px-2 py-1 text-xs font-bold"
                onClick={() => voidAnswer({ roundId: round.id, hostId: meId, targetId: a.player_id })}
              >
                marcar repetida
              </button>
            )}

            {!sent && (
              <div className="flex gap-2">
                <button disabled={self}
                  className={"flex-1 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (best === a.player_id ? pickColor : "bg-white")}
                  onClick={() => setBest(a.player_id)}>{pickLabel}</button>
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
          onClick={async () => {
            setSent(true);
            try {
              await castVote({ roundId: round.id, voterId: meId, bestId: best, worstId: tiebreak ? null : worst });
            } catch {
              setSent(false);
            }
          }}>
          Confirmar voto
        </Button>
      ) : (
        <VotersList players={players} votes={votes} isTiebreak={tiebreak} />
      )}
    </main>
  );
}
