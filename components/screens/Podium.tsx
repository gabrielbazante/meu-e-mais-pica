"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LogoTitle } from "@/components/ui/LogoTitle";
import { Confetti } from "@/components/ui/Confetti";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import { Crown, Restart } from "@/components/icons";
import { closeRoom } from "@/app/actions/room";
import type { PlayerRow } from "@/lib/supabase/database.types";

// Degraus no estilo A2: 1º rosa (mais alto), 2º azul, 3º roxo.
const STEP = {
  1: { h: "h-36", bg: "bg-logo-pink", num: "text-6xl" },
  2: { h: "h-24", bg: "bg-logo-blue", num: "text-5xl" },
  3: { h: "h-16", bg: "bg-logo-purple", num: "text-4xl" },
} as const;

export function Podium({ players, room, meId }: {
  players: PlayerRow[]; room: { id: string; host_id: string }; meId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // O dono encerra e apaga a sala ao sair do pódio; os demais só voltam para o início.
  async function handleAgain() {
    if (meId !== room.host_id) { router.push("/"); return; }
    setBusy(true);
    try { await closeRoom({ roomId: room.id, hostId: meId }); }
    finally { setBusy(false); }
    router.push("/");
  }
  const ordered = [...players].sort((a, b) => b.total_points - a.total_points);
  const joinIndex = colorIndexByJoin(players);
  const [first, second, third] = ordered;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-5 text-center">
      <Confetti variant="party" />
      <LogoTitle>Fim de jogo!</LogoTitle>
      {first && (
        <p className="sticker inline-flex max-w-full -rotate-2 items-center gap-2 break-words font-display text-lg font-extrabold">
          <Crown size={26} />
          {first.name} venceu!
        </p>
      )}
      <div className="mt-4 flex w-full items-end justify-center gap-2">
        <Step player={second} rank={2} colorIndex={joinIndex.get(second?.id ?? "")} />
        <Step player={first} rank={1} colorIndex={joinIndex.get(first?.id ?? "")} />
        <Step player={third} rank={3} colorIndex={joinIndex.get(third?.id ?? "")} />
      </div>
      <Button onClick={handleAgain} disabled={busy} icon={<Restart size={20} />}>Jogar de novo</Button>
    </main>
  );
}

function Step({ player, rank, colorIndex }: { player?: PlayerRow; rank: 1 | 2 | 3; colorIndex?: number }) {
  if (!player) return null;
  const s = STEP[rank];
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <div className="relative">
        {rank === 1 && (
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 -rotate-12">
            <Crown size={36} title="campeã(o)" />
          </span>
        )}
        <BlockAvatar seed={player.id} size={48} colorIndex={colorIndex} />
      </div>
      <span className="w-full [overflow-wrap:anywhere] font-extrabold leading-tight">{player.name}</span>
      <div
        data-rank={rank}
        className={`${s.h} ${s.bg} flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl rounded-b-lg border-3 border-ink pt-2 shadow-chunky`}
      >
        <span className={`text-logo font-display font-extrabold leading-none ${s.num}`}>{rank}</span>
        <span className="pill font-display text-sm">{player.total_points}</span>
      </div>
    </div>
  );
}
