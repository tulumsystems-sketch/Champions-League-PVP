"use server";

import { getCommunityPlayerInfo, getCommunityPlayerStats } from "@/lib/free-fire/providers/community-api-provider";
import { metricCareerTotal } from "@/lib/player-stats";

export type MetricType = "points" | "wins" | "kills" | "damage" | "headshots";

export async function fetchChallengeCareerTotal(uid: string, region = "br", metric: MetricType = "points") {
  if (!uid) {
    return { ok: false as const, message: "El jugador no tiene UID de Free Fire vinculado." };
  }

  const infoResult = await getCommunityPlayerInfo(uid, region);
  if (!infoResult.ok) {
    return { ok: false as const, message: `No se pudieron obtener estadísticas de Free Fire: ${infoResult.message}` };
  }

  const statsResult = await getCommunityPlayerStats(uid, region);
  const stats = statsResult.ok ? statsResult.data : null;

  return { ok: true as const, score: metricCareerTotal(infoResult.data, stats, metric), metric };
}
