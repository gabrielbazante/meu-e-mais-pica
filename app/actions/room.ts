"use server";
import { createServerClient } from "@/lib/supabase/server";

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createRoom(input: { hostId: string; name: string }) {
  const supabase = createServerClient();
  let code = genCode();
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase.from("rooms").select("id").eq("code", code).maybeSingle();
    if (!data) break;
    code = genCode();
  }

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({ code, host_id: input.hostId, status: "lobby" })
    .select()
    .single();
  if (error || !room) throw new Error(error?.message ?? "Falha ao criar sala");

  const { error: pErr } = await supabase
    .from("players")
    .insert({ id: input.hostId, room_id: room.id, name: input.name });
  if (pErr) throw new Error(pErr.message);

  return { code };
}

export async function joinRoom(input: { code: string; playerId: string; name: string }) {
  const supabase = createServerClient();
  const code = input.code.toUpperCase().trim();
  const { data: room } = await supabase
    .from("rooms").select("*").eq("code", code).maybeSingle();
  if (!room) throw new Error("Sala não encontrada");
  if (room.status === "ended") throw new Error("Esta partida já encerrou");

  const { error } = await supabase
    .from("players")
    .upsert(
      { id: input.playerId, room_id: room.id, name: input.name, connected: true },
      { onConflict: "id" },
    );
  if (error) throw new Error(error.message);

  return { code };
}
