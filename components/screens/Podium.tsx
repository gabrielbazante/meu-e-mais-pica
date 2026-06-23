"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import type { PlayerRow } from "@/lib/supabase/database.types";

export function Podium({ players }: { players: PlayerRow[] }) {
  const router = useRouter();
  const ordered = [...players].sort((a, b) => b.total_points - a.total_points);
  const joinIndex = colorIndexByJoin(players);
  const [first, second, third] = ordered;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-5 text-center">
      <h1 className="text-3xl font-black">Fim de jogo! 🏆</h1>
      <p className="text-2xl font-black">👑 {first?.name} ({first?.total_points})</p>
      <div className="flex w-full items-end justify-center gap-2">
        <Step player={second} colorIndex={joinIndex.get(second?.id ?? "")} h="h-24" medal="🥈" />
        <Step player={first} colorIndex={joinIndex.get(first?.id ?? "")} h="h-36" medal="🥇" />
        <Step player={third} colorIndex={joinIndex.get(third?.id ?? "")} h="h-16" medal="🥉" />
      </div>
      <Button onClick={() => router.push("/")}>Jogar de novo</Button>
    </main>
  );
}

function Step({ player, colorIndex, h, medal }: { player?: PlayerRow; colorIndex?: number; h: string; medal: string }) {
  if (!player) return null;
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <BlockAvatar seed={player.id} size={44} colorIndex={colorIndex} />
      <span className="text-2xl">{medal}</span>
      <span className="font-extrabold">{player.name}</span>
      <Card className={`${h} flex w-full items-center justify-center bg-party-yellow !p-0 text-xl font-black`}>{player.total_points}</Card>
    </div>
  );
}
