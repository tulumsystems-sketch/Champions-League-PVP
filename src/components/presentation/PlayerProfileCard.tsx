import Link from "next/link";
import { ShieldCheck, UserRound } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";
import { playerProfile } from "@/lib/presentation-data";

export function PlayerProfileCard({ showAction = true }: { showAction?: boolean }) {
  return (
    <aside className="rounded-lg border border-white/10 bg-neutral-900/80 p-5 shadow-2xl shadow-black/25">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-500/30 to-cyan-500/20 text-xl font-black text-white shadow-lg shadow-orange-950/30">
          {playerProfile.avatarInitials}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-black text-white">{playerProfile.nickname}</h2>
            <StatusBadge tone="emerald">Activo</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-neutral-400">UID Free Fire: {playerProfile.freeFireUid}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-neutral-500">Rango</p>
          <p className="mt-1 font-bold text-cyan-100">{playerProfile.tier}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-neutral-500">Ingreso</p>
          <p className="mt-1 font-bold text-white">{playerProfile.joinedAt}</p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
        <ShieldCheck className="mt-0.5 size-5 text-emerald-300" />
        <div>
          <p className="font-semibold text-emerald-100">UID verificado</p>
          <p className="text-sm text-emerald-100/70">Listo para salas y desafíos.</p>
        </div>
      </div>

      {showAction && (
        <Link
          href="/profile"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-orange-100"
        >
          <UserRound className="size-4" />
          Ver perfil
        </Link>
      )}
    </aside>
  );
}
