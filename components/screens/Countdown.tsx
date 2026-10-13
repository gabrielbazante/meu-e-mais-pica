"use client";
import { useEffect, useState } from "react";
import { beginRound } from "@/app/actions/game";
import type { RoundRow } from "@/lib/supabase/database.types";

export function Countdown({ round }: { round: RoundRow }) {
  const [left, setLeft] = useState(3);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    const end = round.starts_at ? new Date(round.starts_at).getTime() : Date.now();
    const tick = () => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && !fired) {
        setFired(true);
        beginRound({ roundId: round.id }); // idempotente
      }
    };
    tick();
    const t = setInterval(tick, 200);
    return () => clearInterval(t);
  }, [round.id, round.starts_at, fired]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xl font-black opacity-70">Preparando…</p>
      <p className="font-display text-[8rem] font-black leading-none text-party-red">{left > 0 ? left : "🔥"}</p>
    </main>
  );
}
