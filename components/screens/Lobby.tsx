"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import { InviteShare } from "@/components/ui/InviteShare";
import { ManagePlayers } from "@/components/ui/ManagePlayers";
import { startGame } from "@/app/actions/game";
import { deleteRoom, leaveRoom } from "@/app/actions/room";
import { MIN_PLAYERS } from "@/lib/game/phase";
import { Confetti } from "@/components/ui/Confetti";
import { Crown, Exit, Kick, Play } from "@/components/icons";
import type { PlayerRow, RoomRow } from "@/lib/supabase/database.types";

export function Lobby({ room, players, meId }: { room: RoomRow; players: PlayerRow[]; meId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isHost = room.host_id === meId;
  const canStart = players.length >= MIN_PLAYERS;
  const joinIndex = colorIndexByJoin(players);

  async function handleDelete() {
    setBusy(true);
    await deleteRoom({ roomId: room.id, hostId: meId });
    router.push("/");
  }

  async function handleLeave() {
    setBusy(true);
    await leaveRoom({ roomId: room.id, playerId: meId });
    router.push("/");
  }

  return (
    <main className="relative isolate mx-auto flex min-h-screen max-w-md flex-col gap-5 overflow-hidden p-5">
      <Confetti />
      <Card className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-logo-pink">Sala</p>
        <p className="font-display text-5xl font-extrabold tracking-widest">{room.code}</p>
        <p className="mt-1 text-sm font-semibold opacity-70">Chama a galera:</p>
        <InviteShare code={room.code} />
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="font-display font-extrabold">Jogadores ({players.length})</p>
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-2 rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
            <BlockAvatar seed={p.id} size={32} colorIndex={joinIndex.get(p.id)} />
            <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
              {p.name}
              {p.id === room.host_id && <Crown size={20} title="dono da sala" />}
            </span>
          </div>
        ))}
      </Card>

      {isHost ? (
        <div className="flex flex-col gap-3">
          <ManagePlayers roomId={room.id} players={players} meId={meId} hostId={room.host_id} />
          <Button
            disabled={!canStart || busy}
            icon={canStart ? <Play size={20} /> : undefined}
            onClick={async () => { setBusy(true); await startGame({ roomId: room.id, playerId: meId }); }}
          >
            {canStart ? "Começar" : `Faltam ${MIN_PLAYERS - players.length} jogador(es)`}
          </Button>
          <Button disabled={busy} onClick={handleDelete} className="bg-ink! text-white" icon={<Kick size={20} />}>
            Apagar sala e sair
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-center font-bold opacity-70">Aguardando o dono começar…</p>
          <Button disabled={busy} onClick={handleLeave} className="bg-ink! text-white" icon={<Exit size={20} />}>
            Sair da sala
          </Button>
        </div>
      )}
    </main>
  );
}
