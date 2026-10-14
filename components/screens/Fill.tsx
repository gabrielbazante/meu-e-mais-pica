"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { submitAnswer, expireFill } from "@/app/actions/game";
import { ManagePlayers } from "@/components/ui/ManagePlayers";
import { Alert, Check, Clock, Flame, Target } from "@/components/icons";
import type { AnswerRow, PlayerRow, RoundRow, RoomRow } from "@/lib/supabase/database.types";

// Intervalo entre tentativas de expireFill depois que o timer zerou. O servidor
// decide pelo ends_at (clock skew pode tornar uma chamada adiantada um no-op);
// a chamada é idempotente, então repetir até a fase mudar é seguro.
const RETRY_MS = 1000;

export function Fill({ round, room, players, answers, meId, isHost }: {
  round: RoundRow; room: RoomRow; players: PlayerRow[]; answers: AnswerRow[]; meId: string; isHost: boolean;
}) {
  const mine = answers.find((a) => a.player_id === meId);
  const [text, setText] = useState(mine?.text ?? "");
  const [sent, setSent] = useState(!!mine);
  const [left, setLeft] = useState(60);
  const [warn, setWarn] = useState("");
  // Refs (não state) controlam as chamadas: não disparam re-render nem entram nas deps.
  const inFlight = useRef(false);
  const lastCallAt = useRef(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    const end = round.ends_at ? new Date(round.ends_at).getTime() : Date.now() + 60000;
    inFlight.current = false;
    lastCallAt.current = Number.NEGATIVE_INFINITY;

    const call = async () => {
      inFlight.current = true;
      lastCallAt.current = Date.now();
      try {
        await expireFill({ roundId: round.id });
      } catch {
        // Erro engolido de propósito: a próxima tentativa acontece no próximo ciclo.
      } finally {
        inFlight.current = false;
      }
    };

    const t = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      // host garante o avanço; repete até a fase mudar (desmontar limpa o intervalo)
      if (s === 0 && isHost && !inFlight.current && Date.now() - lastCallAt.current >= RETRY_MS) {
        void call();
      }
    }, 250);
    return () => clearInterval(t);
  }, [round.id, round.ends_at, isHost]);

  const sentCount = answers.length;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      {isHost && (
        <div className="flex justify-end">
          <ManagePlayers roomId={room.id} players={players} meId={meId} hostId={room.host_id} />
        </div>
      )}
      <div className="flex items-stretch gap-3">
        <Card className="min-w-0 flex-1 !p-3 text-center">
          <p className="flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider opacity-60">
            <Target size={14} />
            Tema
          </p>
          <p className="break-words font-display text-xl font-extrabold text-logo-blue">{round.theme ?? ""}</p>
        </Card>
        <div className="rounded-2xl border-3 border-ink bg-logo-pink px-4 py-2 text-center shadow-chunkySm">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">Letra</p>
          <p className="text-logo font-display text-4xl font-extrabold leading-none">{round.letter ?? ""}</p>
        </div>
      </div>
      <p className="flex items-center justify-center gap-2 font-display text-2xl font-extrabold">
        <Clock size={30} />
        {left}s
      </p>

      <Card className="flex flex-col gap-3">
        <input
          autoFocus disabled={sent}
          className="rounded-xl border-3 border-ink px-3 py-3 text-lg font-bold outline-none disabled:opacity-60"
          placeholder={`Algo de "${round.theme ?? ""}" com ${round.letter ?? ""}…`}
          value={text} onChange={(e) => setText(e.target.value)}
        />
        <Button
          disabled={sent || !text.trim()}
          onClick={async () => {
            setSent(true);
            setWarn("");
            const res = await submitAnswer({ roundId: round.id, playerId: meId, text });
            if (res?.taken) {
              setSent(false);
              setWarn(`"${res.word}" já foi usada. Manda outra!`);
            }
          }}
          icon={sent ? <Check size={22} /> : <Flame size={22} />}
        >
          {sent ? "Enviado" : "O meu é mais pica"}
        </Button>
        {warn && (
          <p className="flex items-center justify-center gap-2 text-center font-bold text-party-red">
            <Alert size={20} />
            {warn}
          </p>
        )}
      </Card>

      <p className="text-center font-bold opacity-70">{sentCount}/{players.length} responderam</p>
    </main>
  );
}
