"use client";
import { use, useEffect, useState } from "react";
import { useRoom } from "@/lib/useRoom";
import { getPlayerId } from "@/lib/identity";
import { Lobby } from "@/components/screens/Lobby";
import { Fill } from "@/components/screens/Fill";
import { Vote } from "@/components/screens/Vote";
import { Result } from "@/components/screens/Result";
import { Podium } from "@/components/screens/Podium";

export default function SalaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [meId, setMeId] = useState("");
  useEffect(() => setMeId(getPlayerId()), []);
  const { room, players, round, answers, votes, loading } = useRoom(code.toUpperCase());

  if (loading || !meId) return <Center>Carregando…</Center>;
  if (!room) return <Center>Sala não encontrada 😢</Center>;

  const isHost = room.host_id === meId;
  if (room.status === "ended") return <Podium players={players} />;
  if (room.status === "lobby" || !round) return <Lobby room={room} players={players} meId={meId} />;

  switch (round.phase) {
    case "preencher": return <Fill round={round} players={players} answers={answers} meId={meId} isHost={isHost} />;
    case "votar":
    case "desempate": return <Vote round={round} players={players} answers={answers} votes={votes} meId={meId} />;
    case "resultado": return <Result room={room} round={round} players={players} answers={answers} votes={votes} meId={meId} isHost={isHost} />;
    default: return <Center>…</Center>;
  }
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center p-6 text-center text-xl font-black">{children}</main>;
}
