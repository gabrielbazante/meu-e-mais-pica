"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PlayerRow } from "@/lib/supabase/database.types";

export function Podium({ players }: { players: PlayerRow[] }) {
  const router = useRouter();
  const ordered = [...players].sort((a, b) => b.total_points - a.total_points);
  const [first, second, third] = ordered;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-5 text-center">
      <h1 className="text-3xl font-black">Fim de jogo! 🏆</h1>
      <p className="text-2xl font-black">👑 {first?.name} ({first?.total_points})</p>
      <div className="flex w-full items-end justify-center gap-2">
        <Step name={second?.name} pts={second?.total_points} h="h-24" medal="🥈" />
        <Step name={first?.name} pts={first?.total_points} h="h-36" medal="🥇" />
        <Step name={third?.name} pts={third?.total_points} h="h-16" medal="🥉" />
      </div>
      <Button onClick={() => router.push("/")}>Jogar de novo</Button>
    </main>
  );
}

function Step({ name, pts, h, medal }: { name?: string; pts?: number; h: string; medal: string }) {
  if (!name) return null;
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span className="text-2xl">{medal}</span>
      <span className="font-extrabold">{name}</span>
      <Card className={`${h} flex w-full items-center justify-center bg-party-yellow !p-0 text-xl font-black`}>{pts}</Card>
    </div>
  );
}
