"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ManagePlayers } from "@/components/ui/ManagePlayers";
import { VotersList } from "@/components/ui/VotersList";
import { castVote, voidAnswer } from "@/app/actions/game";
import { duplicateGroups } from "@/lib/game/similarity";
import { shuffleBySeed } from "@/lib/game/shuffle";
import { LogoTitle } from "@/components/ui/LogoTitle";
import { Alert, Flame, Scale, Target, Tomato } from "@/components/icons";
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
  // "enviado" é derivado do voto no servidor; pending cobre só a chamada em voo.
  // (Estado congelado no mount ficava preso ao voto do desempate anterior no encadeamento best→worst.)
  const [pending, setPending] = useState(false);
  const sent = !!myVote || pending;
  const [voiding, setVoiding] = useState(false);

  // candidatos: respostas nao-vazias e nao anuladas; no desempate, so os empatados
  const live = answers.filter((a) => a.text.trim() !== "" && !a.voided);
  const candidates = tiebreak ? live.filter((a) => round.tiebreak_candidates.includes(a.player_id)) : live;

  // ordem embaralhada pela rodada: igual para todos e estavel entre re-renders
  const ordered = shuffleBySeed(candidates, round.id);

  // grupos de respostas parecidas, em ordem de chegada (1o do grupo = quem chegou primeiro)
  const groups = duplicateGroups(candidates.map((a) => ({ playerId: a.player_id, text: a.text, submittedAt: new Date(a.submitted_at).getTime() })));
  const groupOf = (id: string) => groups.find((g) => g.includes(id));

  // escolhas que sairam da lista (anulada/expulso) nao contam
  const isCandidate = (id: string | null) => !!id && candidates.some((a) => a.player_id === id);
  const canSend = tiebreak ? isCandidate(best) : isCandidate(best) && isCandidate(worst);
  const worstPick = tiebreak && kind === "worst";
  const pickLabel = worstPick ? "Pior" : "Mais pica";
  const pickIcon = worstPick ? <Tomato size={20} /> : <Flame size={20} />;
  const pickColor = worstPick ? "bg-logo-purple text-white" : "bg-logo-pink text-ink";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 p-5">
      {isHost && (
        <div className="flex justify-end">
          <ManagePlayers roomId={roomId} players={players} meId={meId} hostId={meId} />
        </div>
      )}
      <header className="flex flex-col items-center gap-2 text-center">
        {tiebreak ? (
          <>
            <Scale size={40} />
            <LogoTitle size="md">Desempate</LogoTitle>
            <p className="font-display text-lg font-extrabold">{worstPick ? "Vote no PIOR" : "Vote no MELHOR"}</p>
          </>
        ) : (
          <LogoTitle size="md">Hora de votar</LogoTitle>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="pill"><Target size={16} />{round.theme}</span>
          <span className="pill">Letra <b className="font-display text-base">{round.letter}</b></span>
        </div>
      </header>

      {ordered.map((a) => {
        const self = a.player_id === meId;
        const group = groupOf(a.player_id);
        const flagged = !!group;
        const arrival = group ? group.indexOf(a.player_id) + 1 : 0;
        const showOrder = isHost && !tiebreak && flagged;
        return (
          <Card key={a.player_id} className="flex flex-col gap-2">
            {(self || flagged) && (
              <div className="flex items-center gap-2">
                {self && <span className="text-xs font-bold uppercase tracking-wider opacity-60">Sua resposta</span>}
                {flagged && (
                  <span className="ml-auto inline-flex flex-none items-center gap-2">
                    {showOrder && <span className="pill">chegou {arrival}º</span>}
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-party-red">
                      <Alert size={16} />
                      parece repetida?
                    </span>
                  </span>
                )}
              </div>
            )}
            <p className="[overflow-wrap:anywhere] rounded-lg border-2 border-ink bg-cream px-3 py-2 font-bold">{a.text}</p>

            {isHost && !tiebreak && !self && (
              <button
                disabled={voiding}
                className="self-start rounded-lg border-3 border-ink bg-white px-2 py-1 text-xs font-bold disabled:opacity-50"
                onClick={async () => {
                  if (!window.confirm(`Marcar "${a.text}" como repetida? Ela sai da votação.`)) return;
                  setVoiding(true);
                  try {
                    await voidAnswer({ roundId: round.id, hostId: meId, targetId: a.player_id });
                  } catch {
                    // falha silenciosa: a resposta continua na lista e o dono pode tentar de novo
                  } finally {
                    setVoiding(false);
                  }
                }}
              >
                {arrival > 1 ? "marcar repetida (chegou depois)" : "marcar repetida"}
              </button>
            )}

            {!sent && (
              <div className="flex gap-2">
                <button disabled={self}
                  className={"inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (best === a.player_id ? pickColor : "bg-white")}
                  onClick={() => { setBest(a.player_id); if (!tiebreak && worst === a.player_id) setWorst(null); }}>
                  {pickIcon}
                  {pickLabel}
                </button>
                {!tiebreak && (
                  <button disabled={self}
                    className={"inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border-3 border-ink py-2 font-bold disabled:opacity-30 " + (worst === a.player_id ? "bg-logo-purple text-white" : "bg-white")}
                    onClick={() => { setWorst(a.player_id); if (best === a.player_id) setBest(null); }}>
                    <Tomato size={20} />
                    Pior
                  </button>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {!sent ? (
        <Button disabled={!canSend}
          onClick={async () => {
            setPending(true);
            try {
              await castVote({ roundId: round.id, voterId: meId, bestId: best, worstId: tiebreak ? null : worst });
            } catch {
              setPending(false);
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
