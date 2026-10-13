"use client";
import { useEffect, useRef, useState } from "react";
import { beginRound } from "@/app/actions/game";
import type { RoundRow } from "@/lib/supabase/database.types";

// Intervalo entre tentativas de beginRound quando a contagem chegou a zero.
// O servidor pode ainda considerar starts_at no futuro (clock skew); a chamada
// é idempotente, então repetir até a fase mudar é seguro.
const RETRY_MS = 1000;

export function Countdown({ round }: { round: RoundRow }) {
  const [left, setLeft] = useState(3);
  // Refs (não state) guardam o controle de chamadas: não disparam re-render
  // e não entram nas deps do efeito.
  const inFlight = useRef(false);
  const lastCallAt = useRef(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    const end = round.starts_at ? new Date(round.starts_at).getTime() : Date.now();
    // Nova rodada: reinicia o controle de chamadas.
    inFlight.current = false;
    lastCallAt.current = Number.NEGATIVE_INFINITY;

    const call = async () => {
      inFlight.current = true;
      lastCallAt.current = Date.now();
      try {
        await beginRound({ roundId: round.id });
      } catch {
        // Erro engolido de propósito: a próxima tentativa acontece no próximo ciclo.
      } finally {
        inFlight.current = false;
      }
    };

    const tick = () => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && !inFlight.current && Date.now() - lastCallAt.current >= RETRY_MS) {
        void call();
      }
    };
    tick();
    const t = setInterval(tick, 200);
    // Desmontar (ex.: fase virou preencher) para as tentativas.
    return () => clearInterval(t);
  }, [round.id, round.starts_at]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-xl font-black opacity-70">Preparando…</p>
      <p className="font-display text-[8rem] font-black leading-none text-party-red">{left > 0 ? left : "🔥"}</p>
    </main>
  );
}
