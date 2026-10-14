"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { isRoomClosed } from "@/lib/rooms";
import type { RoomRow, PlayerRow, RoundRow, AnswerRow, VoteRow } from "@/lib/supabase/database.types";

export interface RoomState {
  room: RoomRow | null;
  players: PlayerRow[];
  round: RoundRow | null;
  answers: AnswerRow[];
  votes: VoteRow[];
  loading: boolean;
  closed: boolean;
}

export function useRoom(code: string): RoomState {
  const [state, setState] = useState<RoomState>({
    room: null, players: [], round: null, answers: [], votes: [], loading: true, closed: false,
  });
  const existed = useRef(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: room } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle<RoomRow>();
    const closed = isRoomClosed(existed.current, room ?? null);
    if (!room) { setState((s) => ({ ...s, loading: false, closed })); return; }
    existed.current = true;
    const { data: players } = await supabase.from("players").select("*").eq("room_id", room.id).order("joined_at");
    let round: RoundRow | null = null, answers: AnswerRow[] = [], votes: VoteRow[] = [];
    if (room.current_round_id) {
      const { data: r } = await supabase.from("rounds").select("*").eq("id", room.current_round_id).maybeSingle<RoundRow>();
      round = r ?? null;
      if (round) {
        answers = (await supabase.from("answers").select("*").eq("round_id", round.id)).data ?? [];
        votes = (await supabase.from("votes").select("*").eq("round_id", round.id)).data ?? [];
      }
    }
    setState({ room, players: players ?? [], round, answers, votes, loading: false, closed });
  }, [code]);

  const roomId = state.room?.id ?? null;
  const roundId = state.round?.id ?? null;

  useEffect(() => {
    let active = true;
    const reload = () => { if (active) load(); };
    reload();

    // Assina apenas as mudanças desta sala/rodada (evita reloads de outras salas).
    const supabase = createClient();
    const channel = supabase.channel(`room:${code}:${roomId ?? "new"}:${roundId ?? "none"}`);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` }, reload);
    if (roomId) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` }, reload);
      channel.on("postgres_changes", { event: "*", schema: "public", table: "rounds", filter: `room_id=eq.${roomId}` }, reload);
    }
    if (roundId) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "answers", filter: `round_id=eq.${roundId}` }, reload);
      channel.on("postgres_changes", { event: "*", schema: "public", table: "votes", filter: `round_id=eq.${roundId}` }, reload);
    }
    channel.subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [code, roomId, roundId, load]);

  return state;
}
