"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerId, setPlayerId } from "@/lib/identity";
import { createRoom, joinRoom } from "@/app/actions/room";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim()) return setError("Digite seu nome");
    setBusy(true); setError("");
    try {
      const res = await createRoom({ hostId: getPlayerId(), name: name.trim() });
      if (res.playerId !== getPlayerId()) setPlayerId(res.playerId); // adota a cadeira nova (partida anterior ocupa o id)
      const { code } = res;
      router.push(`/sala/${code}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  async function handleJoin() {
    if (!name.trim()) return setError("Digite seu nome");
    if (code.trim().length !== 4) return setError("Código tem 4 letras");
    setBusy(true); setError("");
    try {
      const res = await joinRoom({ code, playerId: getPlayerId(), name: name.trim() });
      if (res.playerId !== getPlayerId()) setPlayerId(res.playerId); // adota a cadeira recuperada
      router.push(`/sala/${res.code}`);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-5 -mt-16">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="O meu é mais pica" className="mx-auto w-full max-w-sm drop-shadow-[4px_4px_0_rgba(26,26,46,0.25)]" />
      <h1 className="sr-only">O meu é mais pica</h1>
      <Card className="flex flex-col gap-3">
        <input
          className="rounded-xl border-3 border-ink px-3 py-3 font-semibold outline-none"
          placeholder="Seu nome" value={name} maxLength={16}
          onChange={(e) => setName(e.target.value)}
        />

        {mode === "create" ? (
          <>
            <Button onClick={handleCreate} disabled={busy}>Criar sala</Button>
            <button
              type="button"
              onClick={() => { setMode("join"); setError(""); }}
              className="mt-1 text-center font-bold text-ink/70 underline underline-offset-4"
            >
              Quero entrar numa sala
            </button>
          </>
        ) : (
          <>
            <input
              className="rounded-xl border-3 border-ink px-3 py-3 text-center text-2xl font-black uppercase tracking-widest outline-none"
              placeholder="CÓDIGO" value={code} maxLength={4}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <Button onClick={handleJoin} disabled={busy} className="!bg-party-teal">Entrar</Button>
            <button
              type="button"
              onClick={() => { setMode("create"); setError(""); }}
              className="mt-1 text-center font-bold text-ink/70 underline underline-offset-4"
            >
              ← Quero criar uma sala
            </button>
          </>
        )}
      </Card>
      {error && <p className="text-center font-bold text-ink">{error}</p>}
    </main>
  );
}
