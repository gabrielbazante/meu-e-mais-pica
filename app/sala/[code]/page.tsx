"use client";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoom } from "@/lib/useRoom";
import { getPlayerId, setPlayerId } from "@/lib/identity";
import { isStaleDeploymentError, recoverFromStaleDeployment } from "@/lib/staleDeploy";
import { joinRoom } from "@/app/actions/room";
import { Lobby } from "@/components/screens/Lobby";
import { Rules } from "@/components/screens/Rules";
import { Countdown } from "@/components/screens/Countdown";
import { Fill } from "@/components/screens/Fill";
import { Vote } from "@/components/screens/Vote";
import { Result } from "@/components/screens/Result";
import { Podium } from "@/components/screens/Podium";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, Play, Sad } from "@/components/icons";

export default function SalaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const upper = code.toUpperCase();
  const [meId, setMeId] = useState("");
  useEffect(() => setMeId(getPlayerId()), []);
  const { room, players, round, answers, votes, loading, closed } = useRoom(upper);
  const router = useRouter();
  // Sala encerrada pelo dono: quem ainda estava nela volta para a tela inicial com aviso.
  useEffect(() => {
    if (closed) router.replace("/?aviso=sala-encerrada");
  }, [closed, router]);

  if (closed) return <Center>Sala encerrada</Center>;
  if (loading || !meId) return <Center>Carregando…</Center>;
  if (!room) return <Center><Sad size={64} />Sala não encontrada</Center>;

  const isHost = room.host_id === meId;
  if (room.status === "ended") return <Podium players={players} room={room} meId={meId} />;

  // caiu / foi expulso / perdeu o localStorage: oferece reentrar pelo nome
  const inRoom = players.some((p) => p.id === meId);
  if (!inRoom) return <JoinSeat code={upper} meId={meId} onJoined={setMeId} />;

  if (room.status === "lobby" || !round) return <Lobby room={room} players={players} meId={meId} />;

  switch (round.phase) {
    case "regras": return <Rules round={round} meId={meId} isHost={isHost} />;
    case "contagem": return <Countdown round={round} />;
    case "preencher": return <Fill round={round} room={room} players={players} answers={answers} meId={meId} isHost={isHost} />;
    case "votar":
    case "desempate":
      // key inclui a fase e o tipo de desempate: remonta o Vote ao trocar best↔worst
      return <Vote key={`${round.id}:${round.phase}:${round.tiebreak_kind ?? ""}`}
        round={round} players={players} answers={answers} votes={votes} meId={meId} isHost={isHost} roomId={room.id} />;
    case "resultado": return <Result room={room} round={round} players={players} answers={answers} votes={votes} meId={meId} isHost={isHost} />;
    default: return <Center>…</Center>;
  }
}

function JoinSeat({ code, meId, onJoined }: { code: string; meId: string; onJoined: (id: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (reloadTimer.current) clearTimeout(reloadTimer.current); }, []);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-5">
      <Card className="flex w-full flex-col gap-3 text-center">
        <p className="font-display text-2xl font-black">Entrar nesta sala</p>
        <p className="text-sm font-semibold opacity-70">Sala {code}. Use o mesmo nome pra recuperar sua pontuação.</p>
        <input
          className="rounded-xl border-3 border-ink px-3 py-3 text-lg font-bold outline-none"
          placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)}
        />
        <Button disabled={busy || !name.trim()} icon={<Play size={20} />}
          onClick={async () => {
            setBusy(true); setErr("");
            try {
              const res = await joinRoom({ code, playerId: meId, name: name.trim() });
              // adota o id da cadeira (recuperada ou propria) e re-renderiza como esse jogador
              setPlayerId(res.playerId);
              onJoined(res.playerId);
            }
            catch (e) {
              if (isStaleDeploymentError(e)) {
                if (recoverFromStaleDeployment(e)) {
                  setErr("O jogo foi atualizado, recarregando…");
                  reloadTimer.current = setTimeout(() => {
                    setErr("Não recarregou? Atualize a página."); setBusy(false);
                  }, 5000);
                } else {
                  setErr("O jogo foi atualizado. Atualize a página."); setBusy(false);
                }
                return;
              }
              setErr(e instanceof Error ? e.message : "Falha ao entrar"); setBusy(false);
            }
          }}>
          Entrar
        </Button>
        {err && (
          <p className="flex items-center justify-center gap-2 font-bold text-party-red">
            <Alert size={20} />
            {err}
          </p>
        )}
      </Card>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center font-display text-xl font-extrabold">
      {children}
    </main>
  );
}
