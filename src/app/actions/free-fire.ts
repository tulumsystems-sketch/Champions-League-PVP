"use server";

import {
  getCommunityBanCheck,
  getCommunityPlayerInfo,
  getCommunityPlayerStats,
  type CommunityPlayerInfo,
  type CommunityPlayerStats,
  type CommunityProviderErrorCode,
} from "@/lib/free-fire/providers/community-api-provider";
import { getFreeFireErrorMessage } from "@/lib/free-fire/messages";
import { normalizeFreeFireRegion } from "@/lib/free-fire/regions";
import { supabase } from "@/lib/supabase";

export type FetchPlayerActionResult =
  | {
      ok: true;
      info: CommunityPlayerInfo;
      stats: CommunityPlayerStats | null;
    }
  | {
      ok: false;
      errorCode: CommunityProviderErrorCode | "UNAUTHENTICATED" | "DATABASE_ERROR";
      message: string;
    };

export async function fetchAndSyncPlayerFreeFireStats(uid: string, region: string): Promise<FetchPlayerActionResult> {
  const trimmedUid = uid?.trim();
  const normalizedRegion = normalizeFreeFireRegion(region);

  if (!trimmedUid) {
    return {
      ok: false,
      errorCode: "INVALID_UID",
      message: getFreeFireErrorMessage("INVALID_UID"),
    };
  }

  const infoResult = await getCommunityPlayerInfo(trimmedUid, normalizedRegion);
  if (!infoResult.ok) {
    return {
      ok: false,
      errorCode: infoResult.errorCode,
      message: getFreeFireErrorMessage(infoResult.errorCode, infoResult.message),
    };
  }

  const statsResult = await getCommunityPlayerStats(trimmedUid, normalizedRegion);
  const stats = statsResult.ok ? statsResult.data : null;

  return {
    ok: true,
    info: infoResult.data,
    stats,
  };
}

export async function lookupFreeFirePlayer(uid: string, region: string) {
  return fetchAndSyncPlayerFreeFireStats(uid, region);
}

export type BanCheckActionResult =
  | { ok: true; banned: false; period: number | null }
  | { ok: true; banned: true; period: number | null; message: string }
  | { ok: false; banned: false; message: string };

export async function checkFreeFireBan(uid: string): Promise<BanCheckActionResult> {
  const trimmedUid = uid?.trim();
  if (!trimmedUid) {
    return { ok: false, banned: false, message: getFreeFireErrorMessage("INVALID_UID") };
  }

  const result = await getCommunityBanCheck(trimmedUid);
  if (!result.ok) {
    return { ok: false, banned: false, message: getFreeFireErrorMessage(result.errorCode, result.message) };
  }

  if (result.data.banned) {
    const extra = result.data.period && result.data.period > 0 ? ` Periodo: ${result.data.period}.` : "";
    return {
      ok: true,
      banned: true,
      period: result.data.period,
      message: `Esta cuenta de Free Fire está baneada. No puede entrar a desafíos ni salas.${extra}`,
    };
  }

  return { ok: true, banned: false, period: result.data.period };
}

export async function savePlayerFreeFireUid(userId: string, uid: string, region: string, nickname?: string) {
  if (!userId || !uid) {
    return { ok: false, message: "Datos incompletos para guardar el UID." };
  }

  const updatePayload: Record<string, unknown> = {
    freefire_uid: uid.trim(),
  };

  if (nickname) {
    updatePayload.nickname = nickname.trim();
  }

  const { error } = await supabase.from("profiles").update(updatePayload).eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
