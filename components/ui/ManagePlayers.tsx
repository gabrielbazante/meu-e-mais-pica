"use client";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Crown, Kick, Users } from "@/components/icons";
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
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border-3 border-ink bg-white px-3 py-2 text-sm font-bold shadow-chunkySm"
      >
        <Users size={20} />
        Jogadores
      </button>
      {open && (
        <Card className="flex flex-col gap-2">
          <p className="font-display font-extrabold">Gerenciar jogadores</p>
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-party-yellow/40 px-3 py-2 font-bold">
              <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
                {p.name}
                {p.id === hostId && <Crown size={20} title="dono da sala" />}
              </span>
              {p.id !== hostId && (
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`Expulsar ${p.name}`}
                  className="rounded-full disabled:opacity-50"
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await kickPlayer({ roomId, hostId: meId, targetId: p.id });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <Kick size={30} />
                </button>
              )}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
