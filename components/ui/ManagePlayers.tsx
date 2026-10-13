"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { kickPlayer } from "@/app/actions/room";
import type { PlayerRow } from "@/lib/supabase/database.types";

export function ManagePlayers({ roomId, players, meId, hostId }: {
  roomId: string; players: PlayerRow[]; meId: string; hostId: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (meId !== hostId) return null;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border-3 border-ink bg-white px-3 py-2 text-sm font-bold shadow-chunkySm"
      >
        Jogadores
      </button>
      {open && (
        <Card className="flex flex-col gap-2">
          <p className="font-extrabold">Gerenciar jogadores</p>
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
              <span>{p.name}{p.id === hostId && " 👑"}</span>
              {p.id !== hostId && (
                <button
                  disabled={busy}
                  aria-label={`Expulsar ${p.name}`}
                  className="rounded-lg border-3 border-ink bg-party-red px-3 py-1 font-black text-white disabled:opacity-50"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await kickPlayer({ roomId, hostId: meId, targetId: p.id });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
