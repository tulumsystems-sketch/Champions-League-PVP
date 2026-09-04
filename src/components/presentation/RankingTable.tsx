"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import type { LeaderboardEntry } from "@/lib/rooms-db";
import { RankMedal } from "@/components/hud/RankMedal";
import { CountUp } from "@/components/motion/CountUp";
import { LivePulse } from "@/components/hud/LivePulse";
import { cn } from "@/lib/utils";

export function RankingTable({
  rows,
  title = "Top jugadores",
  emptyMessage = "Todavía no hay jugadores rankeados. Cerrá un desafío para aparecer acá.",
  highlightUserId,
}: {
  rows: LeaderboardEntry[];
  title?: string;
  emptyMessage?: string;
  highlightUserId?: string;
}) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const items = body.querySelectorAll("tr");
    if (!items.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(items, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.32, stagger: 0.04, ease: "power2.out" });
    }, body);
    return () => ctx.revert();
  }, [rows]);

  return (
    <div className="arena-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <p className="arena-kicker">Ranking de arena</p>
          <h3 className="mt-1 font-heading text-lg font-bold text-white">{title}</h3>
        </div>
        <LivePulse label="Live" />
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-bold text-white">Sin posiciones todavía</p>
          <p className="mt-2 text-xs leading-5 text-neutral-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Jugador</th>
                <th className="px-5 py-3">Victorias</th>
                <th className="px-5 py-3">Participaciones</th>
                <th className="px-5 py-3">Coins ganadas</th>
                <th className="px-5 py-3">Puntos</th>
              </tr>
            </thead>
            <tbody ref={bodyRef} className="divide-y divide-white/8">
              {rows.map((row, index) => {
                const isMine = Boolean(highlightUserId && row.userId === highlightUserId);
                const place = index + 1;
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors",
                      isMine && "bg-arena/10",
                      place === 1 && !isMine && "bg-amber-500/5",
                    )}
                  >
                    <td className="px-5 py-4">
                      <RankMedal place={place} />
                    </td>
                    <td className="px-5 py-4 font-bold text-white">
                      {row.nickname}
                      {isMine ? <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-arena">Vos</span> : null}
                    </td>
                    <td className="px-5 py-4 text-emerald-200"><CountUp value={row.wins} /></td>
                    <td className="px-5 py-4 text-neutral-300"><CountUp value={row.participations} /></td>
                    <td className="px-5 py-4 text-amber-200"><CountUp value={row.coinsWon} /></td>
                    <td className="px-5 py-4 font-bold text-arena"><CountUp value={row.points} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
