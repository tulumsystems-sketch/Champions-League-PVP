import type { CommunityPlayerInfo, CommunityPlayerStats } from "@/lib/free-fire/providers/community-api-provider";
import { normalizeFreeFireRegion } from "@/lib/free-fire/regions";
import { supabase } from "@/lib/supabase";

export const FREE_FIRE_CACHE_MS = 15 * 60 * 1000;

export type CareerStats = {
  matchesPlayed: number;
  wins: number;
  kills: number;
  damage: number;
  headshots: number;
  rankingPoints: number;
  updatedAt: string | null;
};

export function metricScore(stats: CommunityPlayerStats | null, metric: string | null | undefined) {
  if (isPointsMetric(metric)) return 0;
  const key =
    metric === "kills" ? "kills" : metric === "damage" ? "damage" : metric === "headshots" ? "headshots" : "wins";
  return [stats?.solo, stats?.duo, stats?.squad].reduce((total, bucket) => total + (bucket?.[key] ?? 0), 0);
}

export function metricCareerTotal(
  info: { rankingPoints?: number | null } | null | undefined,
  stats: CommunityPlayerStats | null,
  metric: string | null | undefined,
) {
  if (isPointsMetric(metric)) {
    return Math.max(0, Math.floor(info?.rankingPoints ?? 0));
  }
  return metricScore(stats, metric);
}

export function isPointsMetric(metric: string | null | undefined) {
  return metric === "points" || metric === "ranking_points";
}

export function metricLabel(metric: string | null | undefined) {
  if (isPointsMetric(metric)) return "Puntos";
  if (metric === "kills") return "Kills";
  if (metric === "damage") return "Daño";
  if (metric === "headshots") return "Headshots";
  return "Victorias";
}

export function isFreeFireSnapshotStale(updatedAt: string | null | undefined, maxAgeMs = FREE_FIRE_CACHE_MS) {
  if (!updatedAt) return true;
  const timestamp = new Date(updatedAt).getTime();
  if (!Number.isFinite(timestamp)) return true;
  return Date.now() - timestamp > maxAgeMs;
}

export function aggregateCareerStats(info: CommunityPlayerInfo, stats: CommunityPlayerStats | null): CareerStats {
  const buckets = [stats?.solo, stats?.duo, stats?.squad];
  const sum = (key: "gamesPlayed" | "wins" | "kills" | "damage" | "headshots") =>
    buckets.reduce((total, bucket) => total + (bucket?.[key] ?? 0), 0);

  const wins = sum("wins");
  const kills = sum("kills");

  return {
    matchesPlayed: sum("gamesPlayed"),
    wins,
    kills,
    damage: sum("damage"),
    headshots: sum("headshots"),
    rankingPoints: info.rankingPoints ?? wins * 10 + kills,
    updatedAt: new Date().toISOString(),
  };
}

export async function getStoredCareerStats(userId: string): Promise<CareerStats | null> {
  const { data, error } = await supabase
    .from("player_stats")
    .select("matches_played, ff_wins, kills, damage, headshots, ff_ranking_points, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    matchesPlayed: Number(data.matches_played || 0),
    wins: Number(data.ff_wins || 0),
    kills: Number(data.kills || 0),
    damage: Number(data.damage || 0),
    headshots: Number(data.headshots || 0),
    rankingPoints: Number(data.ff_ranking_points || 0),
    updatedAt: data.updated_at ? String(data.updated_at) : null,
  };
}

export async function persistFreeFireSnapshot(input: {
  userId: string;
  uid: string;
  region: string;
  info: CommunityPlayerInfo;
  stats: CommunityPlayerStats | null;
  avatarUrl?: string | null;
}) {
  const { userId, uid, info, stats } = input;
  const region = normalizeFreeFireRegion(input.region);
  const career = aggregateCareerStats(info, stats);
  const nickname = info.nickname?.trim();

  const profileUpdate: Record<string, unknown> = {
    freefire_uid: uid.trim(),
    freefire_region: region,
    freefire_level: info.level ?? 0,
    freefire_likes: info.liked ?? 0,
    freefire_rank: info.rank ?? 0,
    clan_name: info.clanName,
    signature: info.signature,
  };

  if (nickname) {
    profileUpdate.nickname = nickname;
  }

  if (input.avatarUrl) {
    profileUpdate.avatar_url = input.avatarUrl;
  }

  const { error: profileError } = await supabase.from("profiles").update(profileUpdate).eq("id", userId);

  if (profileError) {
    return { ok: false as const, message: profileError.message };
  }

  const { error: statsError } = await supabase.from("player_stats").upsert(
    {
      user_id: userId,
      matches_played: career.matchesPlayed,
      ff_wins: career.wins,
      kills: career.kills,
      damage: career.damage,
      headshots: career.headshots,
      ff_ranking_points: career.rankingPoints,
      updated_at: career.updatedAt,
    },
    { onConflict: "user_id" },
  );

  if (statsError) {
    return { ok: false as const, message: statsError.message };
  }

  return { ok: true as const, career };
}
