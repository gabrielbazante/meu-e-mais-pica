"use client";
import { Card } from "@/components/ui/Card";
import type { PlayerRow, VoteRow } from "@/lib/supabase/database.types";

export function VotersList({ players, votes, isTiebreak }: {
  players: PlayerRow[]; votes: VoteRow[]; isTiebreak: boolean;
}) {
  const voted = new Set(votes.filter((v) => v.is_tiebreak === isTiebreak).map((v) => v.voter_id));
  return (
    <Card className="flex flex-col gap-2">
      <p className="font-extrabold">Quem já votou ({voted.size}/{players.length})</p>
      {players.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
          <span>{p.name}</span>
          <span className="w-6 text-center text-xl font-black text-party-teal">{voted.has(p.id) ? "✓" : ""}</span>
        </div>
      ))}
    </Card>
  );
}
