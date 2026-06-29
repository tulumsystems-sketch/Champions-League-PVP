import { StatusBadge } from "@/components/presentation/StatusBadge";

type RankingRow = {
  position: number;
  player: string;
  wins: number;
  coins: number;
  points: number;
  trend: string;
};

export function RankingTable({ rows }: { rows: RankingRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-neutral-900/80 shadow-2xl shadow-black/25">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Ranking semanal</p>
          <h3 className="mt-1 text-lg font-bold text-white">Top jugadores</h3>
        </div>
        <StatusBadge tone="cyan">En vivo</StatusBadge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.14em] text-neutral-500">
            <tr>
              <th className="px-5 py-3">#</th>
              <th className="px-5 py-3">Jugador</th>
              <th className="px-5 py-3">Victorias</th>
              <th className="px-5 py-3">Coins</th>
              <th className="px-5 py-3">Puntos</th>
              <th className="px-5 py-3">Tendencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row) => (
              <tr key={row.position} className={row.player === "TulumAce" ? "bg-orange-500/8" : undefined}>
                <td className="px-5 py-4 font-black text-white">{row.position}</td>
                <td className="px-5 py-4">
                  <span className="font-bold text-white">{row.player}</span>
                </td>
                <td className="px-5 py-4 text-neutral-300">{row.wins}</td>
                <td className="px-5 py-4 text-yellow-100">{row.coins}</td>
                <td className="px-5 py-4 text-neutral-300">{row.points.toLocaleString("es-AR")}</td>
                <td className="px-5 py-4">
                  <span className={row.trend.startsWith("+") ? "text-emerald-300" : "text-red-300"}>{row.trend}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
