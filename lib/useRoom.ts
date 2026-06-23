"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RoomRow, PlayerRow, RoundRow, AnswerRow, VoteRow } from "@/lib/supabase/database.types";

export interface RoomState {
  room: RoomRow | null;
  players: PlayerRow[];
  round: RoundRow | null;
  answers: AnswerRow[];
  votes: VoteRow[];
  loading: boolean;
}

export function useRoom(code: string): RoomState {
  const [state, setState] = useState<RoomState>({
    room: null, players: [], round: null, answers: [], votes: [], loading: true,
  });

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: room } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle<RoomRow>();
    if (!room) { setState((s) => ({ ...s, loading: false })); return; }
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
    setState({ room, players: players ?? [], round, answers, votes, loading: false });
  }, [code]);

  useEffect(() => {
    load();
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${code}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "answers" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [code, load]);

  return state;
}
