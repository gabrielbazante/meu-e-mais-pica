"use client";
import { useEffect, useRef, useState } from "react";
import { BlockAvatar, colorIndexByJoin } from "@/components/ui/BlockAvatar";
import { Medal } from "@/components/icons";
import type { PlayerRow } from "@/lib/supabase/database.types";

export function Ranking({ players, deltas }: { players: PlayerRow[]; deltas?: Record<string, number> }) {
  // comeca na ordem ANTIGA (total - delta), depois troca pros totais novos → anima FLIP
  const [useNew, setUseNew] = useState(!deltas);
  useEffect(() => {
    if (!deltas) return;
    const t = setTimeout(() => setUseNew(true), 400);
    return () => clearTimeout(t);
  }, [deltas]);

  const deltaOf = (id: string) => deltas?.[id] ?? 0;
  const scoreOf = (p: PlayerRow) => (useNew ? p.total_points : p.total_points - deltaOf(p.id));
  const ordered = [...players].sort((a, b) => scoreOf(b) - scoreOf(a));

  const joinIndex = colorIndexByJoin(players);
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prevTops = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    ordered.forEach((p) => {
      const el = refs.current.get(p.id);
      if (!el) return;
      const newTop = el.offsetTop;
      const oldTop = prevTops.current.get(p.id);
      prevTops.current.set(p.id, newTop);
      if (oldTop == null || oldTop === newTop) return;

      const delta = oldTop - newTop;
      el.style.transition = "none";
      el.style.transform = `translateY(${delta}px) scale(1.06)`;
      el.style.boxShadow = "10px 14px 0 rgba(26,26,46,.35)";
      el.style.zIndex = "50";
      requestAnimationFrame(() => {
        el.style.transition = "transform 1.3s cubic-bezier(.34,1.25,.5,1), box-shadow .4s ease";
        el.style.transform = "translateY(0) scale(1.06)";
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
      {ordered.map((p, i) => {
        const d = deltaOf(p.id);
        return (
          <div key={p.id}
            ref={(el) => { if (el) refs.current.set(p.id, el); }}
            className="flex items-center gap-3 rounded-2xl border-3 border-ink bg-white px-4 py-3 shadow-chunky">
            <span className="flex w-9 flex-none justify-center">
              {i < 3
                ? <Medal rank={(i + 1) as 1 | 2 | 3} size={34} title={`${i + 1}º lugar`} />
                : <span className="font-display text-xl font-extrabold">{i + 1}º</span>}
            </span>
            <BlockAvatar seed={p.id} size={40} colorIndex={joinIndex.get(p.id)} />
            <span className="min-w-0 flex-1 break-words font-extrabold">{p.name}</span>
            {deltas && (
              <span className={"font-display text-sm font-black " + (d > 0 ? "text-party-teal" : d < 0 ? "text-party-red" : "opacity-40")}>
                {d > 0 ? `+${d}` : d}
              </span>
            )}
            <span className="font-display text-xl font-black">{p.total_points}</span>
          </div>
        );
      })}
    </div>
  );
}
