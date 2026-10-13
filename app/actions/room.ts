"use server";
import { createServerClient } from "@/lib/supabase/server";
import { normalizeAnswer } from "@/lib/game/normalize";
import { maybeAdvanceFromFill, maybeTally } from "./engine";

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

export async function joinRoom(
  input: { code: string; playerId: string; name: string },
): Promise<{ code: string; playerId: string }> {
  const supabase = createServerClient();
  const code = input.code.toUpperCase().trim();
  const { data: room } = await supabase
    .from("rooms").select("*").eq("code", code).maybeSingle();
  if (!room) throw new Error("Sala não encontrada");
  if (room.status === "ended") throw new Error("Esta partida já encerrou");

  // Reconexao por nome: mesmo nome normalizado + mesma sala recupera a cadeira
  // existente (mantendo total_points e, se for a do dono, o host). NAO mutamos a
  // PK nem host_id — devolvemos o id da cadeira e o CLIENTE adota esse id (setPlayerId).
  const { data: existing } = await supabase
    .from("players").select("id,name").eq("room_id", room.id);
  const target = (existing ?? []).find(
    (p) => normalizeAnswer(p.name) === normalizeAnswer(input.name),
  );

  if (target && target.id !== input.playerId) {
    await supabase.from("players").update({ connected: true }).eq("id", target.id);
    return { code, playerId: target.id };
  }

  const { error } = await supabase
    .from("players")
    .upsert(
      { id: input.playerId, room_id: room.id, name: input.name, connected: true },
      { onConflict: "id" },
    );
  if (error) throw new Error(error.message);
  return { code, playerId: input.playerId };
}

export async function deleteRoom(input: { roomId: string; hostId: string }) {
  const supabase = createServerClient();
  const { data: room } = await supabase
    .from("rooms").select("host_id").eq("id", input.roomId).maybeSingle();
  if (!room || room.host_id !== input.hostId) throw new Error("Sem permissão");
  const { error } = await supabase.from("rooms").delete().eq("id", input.roomId);
  if (error) throw new Error(error.message);
}

export async function leaveRoom(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", input.playerId)
    .eq("room_id", input.roomId);
  if (error) throw new Error(error.message);
}

// Dono expulsa um jogador. Respostas e votos DELE caem por ON DELETE CASCADE.
// Re-checa a fase: a saida do expulso pode destravar preencher/votar.
export async function kickPlayer(input: { roomId: string; hostId: string; targetId: string }) {
  const supabase = createServerClient();
  const { data: room } = await supabase
    .from("rooms").select("host_id,current_round_id").eq("id", input.roomId).maybeSingle();
  if (!room || room.host_id !== input.hostId) throw new Error("Só o dono da sala pode fazer isso");
  if (input.targetId === input.hostId) throw new Error("O dono não pode se expulsar");

  // votes.best_id/worst_id referenciam players ON DELETE CASCADE: deletar o expulso
  // apagaria tambem os votos de OUTROS jogadores que o escolheram, e a apuracao
  // nunca fecharia. Zera so os alvos (a linha do votante fica, preservando a contagem).
  const { data: rounds } = await supabase.from("rounds").select("id").eq("room_id", input.roomId);
  const ids = (rounds ?? []).map((r) => r.id);
  if (ids.length) {
    await supabase.from("votes").update({ best_id: null }).in("round_id", ids).eq("best_id", input.targetId);
    await supabase.from("votes").update({ worst_id: null }).in("round_id", ids).eq("worst_id", input.targetId);
  }

  const { error } = await supabase.from("players")
    .delete().eq("id", input.targetId).eq("room_id", input.roomId);
  if (error) throw new Error(error.message);

  if (room.current_round_id) {
    await maybeAdvanceFromFill(supabase, room.current_round_id, false);
    await maybeTally(supabase, room.current_round_id);
  }
}
