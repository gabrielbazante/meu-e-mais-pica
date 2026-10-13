"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { submitAnswer, expireFill } from "@/app/actions/game";
import { ManagePlayers } from "@/components/ui/ManagePlayers";
import type { AnswerRow, PlayerRow, RoundRow, RoomRow } from "@/lib/supabase/database.types";

export function Fill({ round, room, players, answers, meId, isHost }: {
  round: RoundRow; room: RoomRow; players: PlayerRow[]; answers: AnswerRow[]; meId: string; isHost: boolean;
}) {
  const mine = answers.find((a) => a.player_id === meId);
  const [text, setText] = useState(mine?.text ?? "");
  const [sent, setSent] = useState(!!mine);
  const [left, setLeft] = useState(60);
  const [warn, setWarn] = useState("");

  useEffect(() => {
    const end = round.ends_at ? new Date(round.ends_at).getTime() : Date.now() + 60000;
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && isHost) expireFill({ roundId: round.id }); // host garante o avanço
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
      <div className="flex items-center justify-between">
        <Card className="flex-1 !p-3 text-center">
          <p className="text-xs font-bold opacity-60">TEMA</p>
          <p className="text-xl font-black text-party-teal">{round.theme ?? ""}</p>
        </Card>
        <div className="mx-3 rounded-xl border-3 border-ink bg-party-red px-4 py-2 text-center text-white shadow-chunkySm">
          <p className="text-xs font-bold">LETRA</p>
          <p className="text-3xl font-black">{round.letter ?? ""}</p>
        </div>
        <div className="rounded-full border-3 border-ink bg-white px-3 py-2 text-xl font-black">{left}s</div>
      </div>

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
              setWarn(`"${res.word}" já foi usada — manda outra! 😅`);
            }
          }}
        >
          {sent ? "Enviado ✅" : "O meu é mais pica 🔥"}
        </Button>
        {warn && <p className="text-center font-bold text-party-red">{warn}</p>}
      </Card>

      <p className="text-center font-bold opacity-70">{sentCount}/{players.length} responderam</p>
    </main>
  );
}
