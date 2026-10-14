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

// players.id e PK global e o aparelho reusa o mesmo id entre partidas. Se esse id ja
// ocupa uma cadeira em OUTRA sala, devolve um id novo (o cliente adota); senao o proprio.
async function seatIdFor(supabase: ReturnType<typeof createServerClient>, deviceId: string, roomId: string | null) {
  const { data } = await supabase.from("players").select("room_id").eq("id", deviceId).maybeSingle();
  if (data && data.room_id !== roomId) return crypto.randomUUID();
  return deviceId;
}

export async function createRoom(input: { hostId: string; name: string }): Promise<{ code: string; playerId: string }> {
  const supabase = createServerClient();
  const seatId = await seatIdFor(supabase, input.hostId, null);
  let code = genCode();
  for (let i = 0; i < 5; i++) {
    const { data } = await supabase.from("rooms").select("id").eq("code", code).maybeSingle();
    if (!data) break;
    code = genCode();
  }

  const { data: room, error } = await supabase
    .from("rooms")
    .insert({ code, host_id: seatId, status: "lobby" })
    .select()
    .single();
  if (error || !room) throw new Error(error?.message ?? "Falha ao criar sala");

  const { error: pErr } = await supabase
    .from("players")
    .insert({ id: seatId, room_id: room.id, name: input.name, total_points: 0 });
  if (pErr) throw new Error(pErr.message);

  return { code, playerId: seatId };
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
  if (room.status === "closed") throw new Error("Esta sala foi encerrada");

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

  // Caminho normal: cadeira nova. Se o id do aparelho ja esta em outra sala, usa um id novo
  // (pontos e pódio da partida antiga ficam intactos). Linha ja existente NESTA sala so
  // atualiza nome/conexao, preservando os pontos.
  const seatId = await seatIdFor(supabase, input.playerId, room.id);
  const mine = (existing ?? []).some((p) => p.id === seatId);
  const { error } = mine
    ? await supabase.from("players").update({ name: input.name, connected: true }).eq("id", seatId)
    : await supabase.from("players").insert({
        id: seatId, room_id: room.id, name: input.name, connected: true, total_points: 0,
      });
  if (error) {
    // Duas entradas simultaneas do mesmo aparelho: a outra inseriu primeiro (23505).
    // Se a linha ja esta NESTA sala, e idempotente; senao propaga o erro.
    if (error.code === "23505") {
      const { data: row } = await supabase
        .from("players").select("room_id").eq("id", seatId).maybeSingle();
      if (row?.room_id === room.id) return { code, playerId: seatId };
    }
    throw new Error(error.message);
  }
  return { code, playerId: seatId };
}

// Encerra de verdade: avisa todos e apaga a sala (cascade leva jogadores, rodadas, etc).
// Idempotente: sala inexistente retorna sem erro.
export async function closeRoom(input: { roomId: string; hostId: string }) {
  const supabase = createServerClient();
  const { data: room } = await supabase
    .from("rooms").select("host_id").eq("id", input.roomId).maybeSingle();
  if (!room) return;
  if (room.host_id !== input.hostId) throw new Error("Sem permissão");
  // O UPDATE vem antes do DELETE porque o Realtime nao entrega DELETE em assinaturas
  // com filtro; o UPDATE para "closed" e o que faz os clientes saberem do encerramento.
  const { error: uErr } = await supabase.from("rooms").update({ status: "closed" }).eq("id", input.roomId);
  if (uErr) throw new Error(uErr.message);
  const { error } = await supabase.from("rooms").delete().eq("id", input.roomId);
  if (error) throw new Error(error.message);
}

// O Realtime nao entrega DELETE em assinaturas com filtro (o old record so traz a PK,
// entao `room_id=eq.X` nunca casa). Apos remover um jogador, reescreve o host_id atual
// (UPDATE sem efeito) para disparar a assinatura de `rooms` e todos os clientes
// recarregarem. Se a sala nao existe mais, nao faz nada.
async function touchRoom(supabase: ReturnType<typeof createServerClient>, roomId: string) {
  const { data: room } = await supabase.from("rooms").select("host_id").eq("id", roomId).maybeSingle();
  if (!room) return;
  await supabase.from("rooms").update({ host_id: room.host_id }).eq("id", roomId);
}

export async function leaveRoom(input: { roomId: string; playerId: string }) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", input.playerId)
    .eq("room_id", input.roomId);
  if (error) throw new Error(error.message);
  await touchRoom(supabase, input.roomId);
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
  await touchRoom(supabase, input.roomId);

  if (room.current_round_id) {
    await maybeAdvanceFromFill(supabase, room.current_round_id, false);
    await maybeTally(supabase, room.current_round_id);
  }
}
