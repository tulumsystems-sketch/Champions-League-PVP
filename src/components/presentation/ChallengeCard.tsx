import { Coins, UsersRound } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";

type ChallengeTone = "orange" | "cyan" | "emerald";

export function ChallengeCard({
  title,
  mode,
  prize,
  entry,
  starts,
  players,
  status,
  accent,
}: {
  title: string;
  mode: string;
  prize: string;
  entry: string;
  starts: string;
  players: string;
  status: string;
  accent: ChallengeTone;
}) {
  return (
    <article className="rounded-lg border border-white/10 bg-neutral-900/80 p-5 shadow-2xl shadow-black/25">
      <div className="flex items-start justify-between gap-4">
        <div>
          <StatusBadge tone={accent}>{status}</StatusBadge>
          <h3 className="mt-4 text-xl font-black tracking-tight text-white">{title}</h3>
          <p className="mt-1 text-sm text-neutral-400">{mode}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Inicia</p>
          <p className="text-sm font-bold text-white">{starts}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-neutral-400">
            <Coins className="size-4 text-yellow-300" />
            Premio
          </div>
          <p className="mt-1 font-bold text-white">{prize}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <div className="flex items-center gap-2 text-neutral-400">
            <UsersRound className="size-4 text-cyan-300" />
            Cupos
          </div>
          <p className="mt-1 font-bold text-white">{players}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-sm text-neutral-400">Entrada</span>
        <span className="font-bold text-orange-200">{entry}</span>
      </div>
    </article>
  );
}
