"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import { startGame } from "@/app/actions/game";
import { MIN_PLAYERS } from "@/lib/game/phase";
import type { PlayerRow, RoomRow } from "@/lib/supabase/database.types";

export function Lobby({ room, players, meId }: { room: RoomRow; players: PlayerRow[]; meId: string }) {
  const [busy, setBusy] = useState(false);
  const isHost = room.host_id === meId;
  const canStart = players.length >= MIN_PLAYERS;
  const joinIndex = colorIndexByJoin(players);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      <Card className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-party-red">Código da sala</p>
        <p className="font-display text-5xl font-black tracking-widest">{room.code}</p>
        <p className="mt-1 text-sm font-semibold opacity-70">Compartilhe com a galera</p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="font-extrabold">Jogadores ({players.length})</p>
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
            <BlockAvatar seed={p.id} size={32} colorIndex={joinIndex.get(p.id)} />
            <span>{p.name}{p.id === room.host_id && " 👑"}</span>
          </div>
        ))}
      </Card>

      {isHost ? (
        <Button disabled={!canStart || busy} onClick={async () => { setBusy(true); await startGame({ roomId: room.id, playerId: meId }); }}>
          {canStart ? "Começar 🔥" : `Faltam ${MIN_PLAYERS - players.length} jogador(es)`}
        </Button>
      ) : (
        <p className="text-center font-bold opacity-70">Aguardando o dono começar…</p>
      )}
    </main>
  );
}
