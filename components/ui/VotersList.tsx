"use client";
import { Card } from "@/components/ui/Card";
import { Check } from "@/components/icons";
import type { PlayerRow, VoteRow } from "@/lib/supabase/database.types";

export function VotersList({ players, votes, isTiebreak }: {
  players: PlayerRow[]; votes: VoteRow[]; isTiebreak: boolean;
}) {
  const voted = new Set(votes.filter((v) => v.is_tiebreak === isTiebreak).map((v) => v.voter_id));
  return (
    <Card className="flex flex-col gap-2">
      <p className="font-display font-extrabold">Quem já votou ({voted.size}/{players.length})</p>
      {players.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
          <span className="min-w-0 break-words">{p.name}</span>
          {voted.has(p.id)
            ? <Check size={24} title="votou" />
            : <span className="sr-only">ainda não votou</span>}
        </div>
      ))}
    </Card>
  );
}
