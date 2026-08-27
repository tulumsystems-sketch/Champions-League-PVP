"use client";

import { Crown, Swords, Target, Trophy, Users } from "lucide-react";

import type { CommunityPlayerInfo, CommunityPlayerStats, CommunityStatsBucket } from "@/lib/free-fire/providers/community-api-provider";
import { getFreeFireRegionLabel } from "@/lib/free-fire/regions";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { CombatStat } from "@/components/motion/CombatStat";
import { PlayerAvatar } from "@/components/motion/PlayerAvatar";
import { getFreeFireAvatarUrl } from "@/lib/free-fire/providers/community-api-provider";

type FreeFireStatsPreviewProps = {
  info: CommunityPlayerInfo;
  stats: CommunityPlayerStats | null;
  region: string;
};

export function FreeFireStatsPreview({ info, stats, region }: FreeFireStatsPreviewProps) {
  return (
    <div className="arena-panel space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <PlayerAvatar src={getFreeFireAvatarUrl(info.avatarId)} name={info.nickname || "Jugador"} size="lg" />
          <div>
            <StatusBadge tone="cyan">Datos en vivo</StatusBadge>
            <h3 className="mt-2 font-heading text-2xl font-bold text-white">{info.nickname || "Jugador sin nickname"}</h3>
            <p className="mt-1 text-sm text-neutral-400">
              UID {info.accountId || "—"} · Región {info.region || getFreeFireRegionLabel(region)}
            </p>
          </div>
        </div>
        <div className="arena-stat text-right">
          <p className="arena-kicker">Nivel</p>
          <p className="font-heading text-3xl font-bold text-orange-200">{info.level ?? "—"}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Trophy} label="Rango BR" value={formatNumber(info.rank)} />
        <StatTile icon={Crown} label="Puntos de rango" value={formatNumber(info.rankingPoints)} />
        <StatTile icon={Target} label="Rango CS" value={formatNumber(info.csRank)} />
        <StatTile icon={Users} label="Clan" value={info.clanName || "Sin clan"} meta={info.clanLevel ? `Nivel ${info.clanLevel}` : undefined} />
      </div>

      {info.signature && (
        <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-neutral-300">
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
    <div className="arena-stat">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="size-4" />
        <p className="arena-kicker">{label}</p>
      </div>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
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
      <div className="arena-stat">
        <StatusBadge tone={tone}>{title}</StatusBadge>
        <p className="mt-3 text-sm text-neutral-500">Sin datos disponibles.</p>
      </div>
    );
  }

  return (
    <div className="arena-panel p-4">
      <StatusBadge tone={tone}>{title}</StatusBadge>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <CombatStat label="Partidas" value={bucket.gamesPlayed ?? 0} />
        <CombatStat label="Victorias" value={bucket.wins ?? 0} tone="win" />
        <CombatStat label="Kills" value={bucket.kills ?? 0} tone="kill" />
        <CombatStat label="Headshots" value={bucket.headshots ?? 0} tone="headshot" />
      </div>
    </div>
  );
}

function formatNumber(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("es").format(value);
}
