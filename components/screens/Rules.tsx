"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { dismissRules } from "@/app/actions/game";
import type { RoundRow } from "@/lib/supabase/database.types";

export function Rules({ round, meId, isHost }: { round: RoundRow; meId: string; isHost: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-5 p-5">
      <h1 className="font-display text-center text-3xl font-black">Como joga 🔥</h1>
      <Card className="flex flex-col gap-3 font-semibold">
        <p>🎯 Sai um <b>tema</b> e uma <b>letra</b>. Responda algo do tema começando com a letra.</p>
        <p>⏱️ Você tem <b>1 minuto</b>. Não dá pra repetir palavra que já foi usada.</p>
        <p>🗳️ Depois todo mundo vota no <b>mais pica</b> e no <b>pior</b> (não dá pra votar em você).</p>
        <p>🏆 Pontos: <b>+10</b> pro melhor, <b>+2</b> pra quem respondeu, <b>0</b> pro pior e <b>−1</b> pra quem não respondeu.</p>
        <p>⚖️ Empatou? Rola <b>desempate</b>.</p>
      </Card>
      {isHost ? (
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await dismissRules({ roundId: round.id, playerId: meId });
            } catch {
              setBusy(false);
            }
          }}
        >
          Bora! 🔥
        </Button>
      ) : (
        <p className="text-center font-bold opacity-70">Aguardando o dono começar…</p>
      )}
    </main>
  );
}
