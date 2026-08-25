import { Crown, Swords, Target, Trophy, Users } from "lucide-react";

import type { CommunityPlayerInfo, CommunityPlayerStats, CommunityStatsBucket } from "@/lib/free-fire/providers/community-api-provider";
import { getFreeFireRegionLabel } from "@/lib/free-fire/regions";
import { StatusBadge } from "@/components/presentation/StatusBadge";

type FreeFireStatsPreviewProps = {
  info: CommunityPlayerInfo;
  stats: CommunityPlayerStats | null;
  region: string;
};

export function FreeFireStatsPreview({ info, stats, region }: FreeFireStatsPreviewProps) {
  return (
    <div className="space-y-4 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StatusBadge tone="cyan">Datos en vivo</StatusBadge>
          <h3 className="mt-3 text-2xl font-black text-white">{info.nickname || "Jugador sin nickname"}</h3>
          <p className="mt-1 text-sm text-neutral-400">
            UID {info.accountId || "—"} · Región {info.region || getFreeFireRegionLabel(region)}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Nivel</p>
          <p className="text-3xl font-black text-orange-200">{info.level ?? "—"}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Trophy} label="Rango BR" value={formatNumber(info.rank)} />
        <StatTile icon={Crown} label="Puntos de rango" value={formatNumber(info.rankingPoints)} />
        <StatTile icon={Target} label="Rango CS" value={formatNumber(info.csRank)} />
        <StatTile icon={Users} label="Clan" value={info.clanName || "Sin clan"} meta={info.clanLevel ? `Nivel ${info.clanLevel}` : undefined} />
      </div>

      {info.signature && (
        <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-300">
          “{info.signature}”
        </p>
      )}

      {stats && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-neutral-400">
            <Swords className="size-4 text-orange-300" />
            Estadísticas de carrera
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <ModeStats title="Solo" bucket={stats.solo} tone="orange" />
            <ModeStats title="Duo" bucket={stats.duo} tone="cyan" />
            <ModeStats title="Squad" bucket={stats.squad} tone="emerald" />
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  meta,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  meta?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="size-4" />
        <p className="text-xs uppercase tracking-[0.16em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-black text-white">{value}</p>
      {meta && <p className="mt-1 text-xs text-neutral-500">{meta}</p>}
    </div>
  );
}

function ModeStats({
  title,
  bucket,
  tone,
}: {
  title: string;
  bucket: CommunityStatsBucket | null;
  tone: "orange" | "cyan" | "emerald";
}) {
  if (!bucket) {
    return (
      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <StatusBadge tone={tone}>{title}</StatusBadge>
        <p className="mt-3 text-sm text-neutral-500">Sin datos disponibles.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <StatusBadge tone={tone}>{title}</StatusBadge>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Partidas" value={formatNumber(bucket.gamesPlayed)} />
        <Metric label="Victorias" value={formatNumber(bucket.wins)} />
        <Metric label="Kills" value={formatNumber(bucket.kills)} />
        <Metric label="Headshots" value={formatNumber(bucket.headshots)} />
        <Metric label="Daño" value={formatNumber(bucket.damage)} />
      </dl>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-neutral-500">{label}</dt>
      <dd className="mt-1 font-bold text-white">{value}</dd>
    </div>
  );
}

function formatNumber(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es").format(value);
}
