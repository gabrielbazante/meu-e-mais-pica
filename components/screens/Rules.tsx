"use client";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LogoTitle } from "@/components/ui/LogoTitle";
import { Confetti } from "@/components/ui/Confetti";
import { Ballot, Clock, Play, Scale, Target, Trophy } from "@/components/icons";
import { dismissRules } from "@/app/actions/game";
import type { RoundRow } from "@/lib/supabase/database.types";

function Rule({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      {icon}
      <p className="min-w-0">{children}</p>
    </li>
  );
}

export function Rules({ round, meId, isHost }: { round: RoundRow; meId: string; isHost: boolean }) {
  const [busy, setBusy] = useState(false);
  return (
    <main className="relative isolate mx-auto flex min-h-screen max-w-md flex-col gap-5 overflow-hidden p-5">
      <Confetti />
      <LogoTitle>Como joga</LogoTitle>
      <Card className="font-semibold">
        <ul className="flex flex-col gap-3">
          <Rule icon={<Target size={28} />}>Sai um <b>tema</b> e uma <b>letra</b>. Responda algo do tema começando com a letra.</Rule>
          <Rule icon={<Clock size={28} />}>Você tem <b>1 minuto</b>. Não dá pra repetir palavra que já foi usada.</Rule>
          <Rule icon={<Ballot size={28} />}>Depois todo mundo vota no <b>mais pica</b> e no <b>pior</b> (não dá pra votar em você).</Rule>
          <Rule icon={<Trophy size={28} />}>Pontos: <b>+10</b> pro melhor, <b>+2</b> pra quem respondeu, <b>0</b> pro pior e <b>−1</b> pra quem não respondeu.</Rule>
          <Rule icon={<Scale size={28} />}>Empatou? Rola <b>desempate</b>.</Rule>
        </ul>
      </Card>
      {isHost ? (
        <Button
          disabled={busy}
          icon={<Play size={20} />}
          onClick={async () => {
            setBusy(true);
            try {
              await dismissRules({ roundId: round.id, playerId: meId });
            } catch {
              setBusy(false);
            }
          }}
        >
          Bora!
        </Button>
      ) : (
        <p className="text-center font-bold opacity-70">Aguardando o dono começar…</p>
      )}
    </main>
  );
}
