"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerId } from "@/lib/identity";
import { createRoom, joinRoom } from "@/app/actions/room";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return setError("Digite seu nome");
    setBusy(true); setError("");
    try {
      const { code } = await createRoom({ hostId: getPlayerId(), name: name.trim() });
      router.push(`/sala/${code}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  async function handleJoin() {
    if (!name.trim()) return setError("Digite seu nome");
    if (code.trim().length !== 4) return setError("Código tem 4 letras");
    setBusy(true); setError("");
    try {
      const res = await joinRoom({ code, playerId: getPlayerId(), name: name.trim() });
      router.push(`/sala/${res.code}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-5">
      <h1 className="text-center text-4xl font-black leading-none">O meu é<br />mais pica 🔥</h1>
      <Card className="flex flex-col gap-3">
        <input
          className="rounded-xl border-3 border-ink px-3 py-3 font-semibold outline-none"
          placeholder="Seu nome" value={name} maxLength={16}
          onChange={(e) => setName(e.target.value)}
        />
        <Button onClick={handleCreate} disabled={busy}>Criar sala</Button>
      </Card>
      <Card className="flex flex-col gap-3">
        <input
          className="rounded-xl border-3 border-ink px-3 py-3 text-center text-2xl font-black uppercase tracking-widest outline-none"
          placeholder="CÓDIGO" value={code} maxLength={4}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button onClick={handleJoin} disabled={busy} className="bg-party-teal">Entrar</Button>
      </Card>
      {error && <p className="text-center font-bold text-ink">{error}</p>}
    </main>
  );
}
