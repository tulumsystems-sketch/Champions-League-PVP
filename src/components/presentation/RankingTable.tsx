import type { LeaderboardEntry } from "@/lib/rooms-db";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { cn } from "@/lib/utils";

export function RankingTable({
  rows,
  title = "Top jugadores",
  emptyMessage = "Todavía no hay jugadores en el ranking. Jugá salas o desafíos para aparecer.",
  highlightUserId,
}: {
  rows: LeaderboardEntry[];
  title?: string;
  emptyMessage?: string;
  highlightUserId?: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/80 shadow-2xl shadow-black/25">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Ranking de arena</p>
          <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
        </div>
        <StatusBadge tone="cyan">Supabase</StatusBadge>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-bold text-white">Sin posiciones todavía</p>
          <p className="mt-2 text-xs leading-5 text-neutral-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.14em] text-neutral-500">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Jugador</th>
                <th className="px-5 py-3">Victorias</th>
                <th className="px-5 py-3">Participaciones</th>
                <th className="px-5 py-3">Coins ganadas</th>
                <th className="px-5 py-3">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row, index) => {
                const isMine = Boolean(highlightUserId && row.userId === highlightUserId);
                return (
                  <tr key={row.id} className={cn(isMine && "bg-orange-500/10")}>
                    <td className="px-5 py-4 font-black text-white">{index + 1}</td>
                    <td className="px-5 py-4 font-bold text-white">
                      {row.nickname}
                      {isMine ? <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-orange-300">Vos</span> : null}
                    </td>
                    <td className="px-5 py-4 text-neutral-300">{row.wins.toLocaleString("es-AR")}</td>
                    <td className="px-5 py-4 text-neutral-300">{row.participations.toLocaleString("es-AR")}</td>
                    <td className="px-5 py-4 text-neutral-300">{row.coinsWon.toLocaleString("es-AR")}</td>
                    <td className="px-5 py-4 font-bold text-orange-200">{row.points.toLocaleString("es-AR")}</td>
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
