"use client";
import { useEffect, useRef } from "react";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import type { PlayerRow } from "@/lib/supabase/database.types";

const MEDALS = ["🥇", "🥈", "🥉"];

export function Ranking({ players }: { players: PlayerRow[] }) {
  const ordered = [...players].sort((a, b) => b.total_points - a.total_points);
  // cor por ordem de entrada (estável por pessoa, distinta entre jogadores)
  const joinIndex = colorIndexByJoin(players);
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTops = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // FLIP: compara posição anterior com a atual e anima a diferença
    ordered.forEach((p) => {
      const el = refs.current.get(p.id);
      if (!el) return;
      const newTop = el.offsetTop;
      const oldTop = prevTops.current.get(p.id);
      prevTops.current.set(p.id, newTop);
      if (oldTop == null || oldTop === newTop) return;

      const delta = oldTop - newTop;
      // 1) DESCOLA: posiciona no lugar antigo, levantada
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px) scale(1.06)`;
      el.style.boxShadow = "10px 14px 0 rgba(26,26,46,.35)";
      el.style.zIndex = "50";
      requestAnimationFrame(() => {
        // 2) VIAJA até o novo lugar (devagar)
        el.style.transition = "transform 1.3s cubic-bezier(.34,1.25,.5,1), box-shadow .4s ease";
        el.style.transform = "translateY(0) scale(1.06)";
        // 3) ASSENTA
        setTimeout(() => {
          el.style.transition = "transform .4s ease, box-shadow .4s ease";
          el.style.transform = "translateY(0) scale(1)";
          el.style.boxShadow = "4px 4px 0 #1a1a2e";
          el.style.zIndex = "1";
        }, 1350);
      });
    });
  }, [ordered]);

  return (
    <div className="flex flex-col gap-3">
      {ordered.map((p, i) => (
        <div key={p.id}
          ref={(el) => { if (el) refs.current.set(p.id, el); }}
          className="flex items-center gap-3 rounded-2xl border-3 border-ink bg-white px-4 py-3 shadow-chunky">
          <span className="w-8 text-center text-xl font-black">{MEDALS[i] ?? `${i + 1}º`}</span>
          <BlockAvatar seed={p.id} size={40} colorIndex={joinIndex.get(p.id)} />
          <span className="flex-1 font-extrabold">{p.name}</span>
          <span className="text-xl font-black">{p.total_points}</span>
        </div>
      ))}
    </div>
  );
}
