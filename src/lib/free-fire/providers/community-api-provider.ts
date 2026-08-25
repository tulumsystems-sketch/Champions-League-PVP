const DEFAULT_BASE_URL = "https://developers.freefirecommunity.com/api/v1";
const TIMEOUT_MS = 12000;

export type CommunityProviderErrorCode =
  | "INVALID_UID"
  | "PLAYER_NOT_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "UNAUTHORIZED"
  | "TIMEOUT";

export type CommunityPlayerInfo = {
  accountId: string | null;
  nickname: string | null;
  region: string | null;
  level: number | null;
  rank: number | null;
  rankingPoints: number | null;
  csRank: number | null;
  liked: number | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  clanName: string | null;
  clanLevel: number | null;
  signature: string | null;
  avatarId: string | null;
  petLevel: number | null;
  fields: string[];
};

export type CommunityStatsBucket = {
  gamesPlayed: number | null;
  wins: number | null;
  kills: number | null;
  damage: number | null;
  headshots: number | null;
  deaths: number | null;
  topNTimes: number | null;
  fields: string[];
};

export type CommunityPlayerStats = {
  solo: CommunityStatsBucket | null;
  duo: CommunityStatsBucket | null;
  squad: CommunityStatsBucket | null;
  fields: string[];
};

export type CommunityBanCheck = {
  banned: boolean;
  period: number | null;
};

export type CommunityProviderResult<T> =
  | {
      ok: true;
      endpoint: string;
      status: number;
      responseMs: number;
      data: T;
    }
  | {
      ok: false;
      endpoint: string;
      status: number | null;
      responseMs: number;
      errorCode: CommunityProviderErrorCode;
      message: string;
      fields: string[];
    };

type ProviderRequestResult =
  | {
      ok: true;
      status: number;
      responseMs: number;
      body: unknown;
    }
  | {
      ok: false;
      endpoint: string;
      status: number | null;
      responseMs: number;
      errorCode: CommunityProviderErrorCode;
      message: string;
      fields: string[];
    };

export async function getCommunityPlayerInfo(uid: string, region = "br"): Promise<CommunityProviderResult<CommunityPlayerInfo>> {
  const validationError = validateUid(uid);
  const normalizedRegion = region.trim().toLowerCase();
  const endpoint = `/info?region=${encodeURIComponent(normalizedRegion)}&uid=${encodeURIComponent(uid.trim())}`;

  if (validationError) {
    return providerError<CommunityPlayerInfo>(endpoint, null, 0, "INVALID_UID", validationError, []);
  }

  const result = await requestCommunityProvider(endpoint);

  if (!result.ok) return result;

  return {
    ok: true,
    endpoint,
    status: result.status,
    responseMs: result.responseMs,
    data: normalizePlayerInfo(result.body),
  };
}

export async function getCommunityPlayerStats(uid: string, region = "br"): Promise<CommunityProviderResult<CommunityPlayerStats>> {
  const validationError = validateUid(uid);
  const normalizedRegion = region.trim().toLowerCase();
  const endpoint = `/stats?region=${encodeURIComponent(normalizedRegion)}&uid=${encodeURIComponent(uid.trim())}`;

  if (validationError) {
    return providerError<CommunityPlayerStats>(endpoint, null, 0, "INVALID_UID", validationError, []);
  }

  const result = await requestCommunityProvider(endpoint);

  if (!result.ok) return result;

  return {
    ok: true,
    endpoint,
    status: result.status,
    responseMs: result.responseMs,
    data: normalizePlayerStats(result.body),
  };
}

export async function getCommunityBanCheck(uid: string): Promise<CommunityProviderResult<CommunityBanCheck>> {
  const validationError = validateUid(uid);
  const endpoint = `/bancheck?uid=${encodeURIComponent(uid.trim())}&lang=es`;

  if (validationError) {
    return providerError<CommunityBanCheck>(endpoint, null, 0, "INVALID_UID", validationError, []);
  }

  const result = await requestCommunityProvider(endpoint);
  if (!result.ok) return result;

  return {
    ok: true,
    endpoint,
    status: result.status,
    responseMs: result.responseMs,
    data: normalizeBanCheck(result.body),
  };
}

async function requestCommunityProvider(endpointPath: string): Promise<ProviderRequestResult> {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const apiKey = process.env.FREE_FIRE_API_KEY;
  if (!apiKey) {
    return providerError(
      endpointPath,
      null,
      0,
      "PROVIDER_ERROR",
      "FREE_FIRE_API_KEY is not configured in server environment.",
      [],
    );
  }

  const baseUrl = getBaseUrl();
  const separator = endpointPath.includes("?") ? "&" : "?";
  const url = `${baseUrl}${endpointPath}${separator}key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        "User-Agent": "ChampionsLeagueWeb/1.0",
        accept: "application/json",
      },
      signal: controller.signal,
    });

    const responseMs = Math.round(performance.now() - startedAt);
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    const fields = collectFieldNames(body);

    if (!response.ok) {
      return providerError(endpointPath, response.status, responseMs, mapHttpError(response.status), getErrorMessage(body), fields);
    }

    if (isEmptyProviderBody(body)) {
      return providerError(endpointPath, response.status, responseMs, "PLAYER_NOT_FOUND", "Player data was not found.", fields);
    }

    return { ok: true as const, status: response.status, responseMs, body };
  } catch (error) {
    const responseMs = Math.round(performance.now() - startedAt);
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return providerError(
      endpointPath,
      null,
      responseMs,
      isTimeout ? "TIMEOUT" : "PROVIDER_UNAVAILABLE",
      isTimeout ? "Provider request timed out after 12 seconds." : getUnknownErrorMessage(error),
      [],
    );
  } finally {
    clearTimeout(timeout);
  }
}

function getBaseUrl() {
  return (process.env.FREE_FIRE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function validateUid(uid: string) {
  if (!uid || !/^\d{5,15}$/.test(uid.trim())) {
    return "UID must be numeric and have between 5 and 15 digits.";
  }
  return null;
}

function normalizePlayerInfo(body: unknown): CommunityPlayerInfo {
  const record = unwrapPayload(body);
  const basicInfo = getRecord(record.basicInfo);
  const clanBasicInfo = getRecord(record.clanBasicInfo);
  const socialInfo = getRecord(record.socialInfo);
  const profileInfo = getRecord(record.profileInfo);
  const petInfo = getRecord(record.petInfo);

  return {
    accountId: getString(basicInfo.accountId || record.accountId),
    nickname: getString(basicInfo.nickname || record.nickname),
    region: getString(basicInfo.region || record.region),
    level: getNumber(basicInfo.level ?? record.level),
    rank: getNumber(basicInfo.rank ?? record.rank),
    rankingPoints: getNumber(basicInfo.rankingPoints ?? basicInfo.ranking_points ?? basicInfo.rankPoint),
    csRank: getNumber(basicInfo.csRank ?? basicInfo.cs_rank),
    liked: getNumber(basicInfo.liked ?? basicInfo.likes ?? record.liked),
    lastLoginAt: getString(basicInfo.lastLoginAt || basicInfo.last_login_at),
    createdAt: getString(basicInfo.createAt || basicInfo.createdAt),
    clanName: getString(clanBasicInfo.clanName),
    clanLevel: getNumber(clanBasicInfo.clanLevel),
    signature: getString(socialInfo.signature),
    avatarId: getString(profileInfo.avatarId || profileInfo.avatar_id),
    petLevel: getNumber(petInfo.level),
    fields: collectFieldNames(body),
  };
}

function normalizePlayerStats(body: unknown): CommunityPlayerStats {
  const record = unwrapPayload(body);

  return {
    solo: findStatsBucket(record, "solo"),
    duo: findStatsBucket(record, "duo"),
    squad: findStatsBucket(record, "squad"),
    fields: collectFieldNames(body),
  };
}

function normalizeBanCheck(body: unknown): CommunityBanCheck {
  const record = getRecord(body);
  const data = { ...record, ...getRecord(record.data) };
  const flag = data.is_banned ?? data.isBanned ?? data.banned;

  return {
    banned: flag === true || flag === 1 || flag === "1" || flag === "true",
    period: getNumber(data.period),
  };
}

function findStatsBucket(record: Record<string, unknown>, mode: "solo" | "duo" | "squad"): CommunityStatsBucket | null {
  const aliases = mode === "squad" ? ["squad", "quad"] : [mode];
  const entries = Object.entries(record);
  const careerMatch = entries.find(([key]) => {
    const normalizedKey = key.toLowerCase();
    return normalizedKey.includes("career") && aliases.some((alias) => normalizedKey.includes(alias));
  });
  if (careerMatch) return normalizeStatsBucket(careerMatch[1]);

  const fallback = entries.find(([key]) => {
    const normalizedKey = key.toLowerCase();
    return aliases.some((alias) => normalizedKey.includes(alias)) && !normalizedKey.includes("captain");
  });
  return fallback ? normalizeStatsBucket(fallback[1]) : null;
}

function normalizeStatsBucket(value: unknown): CommunityStatsBucket {
  const record = getRecord(value);
  const detailed = getRecord(record.detailedstats || record.detailedStats || record.detailed_stats);

  return {
    gamesPlayed: firstNumber(record, detailed, ["gamesPlayed", "gamesplayed", "games_played"]),
    wins: firstNumber(record, detailed, ["wins"]),
    kills: firstNumber(record, detailed, ["kills"]),
    damage: firstNumber(record, detailed, ["damage"]),
    headshots: firstNumber(record, detailed, ["headshots", "headshotkills", "headshotKills", "headshot_kills"]),
    deaths: firstNumber(record, detailed, ["deaths"]),
    topNTimes: firstNumber(record, detailed, ["topNTimes", "topntimes", "top_n_times"]),
    fields: collectFieldNames(value),
  };
}

function firstNumber(top: Record<string, unknown>, nested: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const fromTop = getNumber(top[key]);
    if (fromTop != null) return fromTop;
    const fromNested = getNumber(nested[key]);
    if (fromNested != null) return fromNested;
  }
  return null;
}

function unwrapPayload(body: unknown): Record<string, unknown> {
  const record = getRecord(body);
  if (record.basicInfo || record.brCareer_solo || record.brCareer_duo || record.brCareer_squad) {
    return record;
  }

  const nested = getRecord(record.data);
  if (Object.keys(nested).length > 0) {
    return { ...record, ...nested };
  }

  return record;
}

function providerError<T>(
  endpoint: string,
  status: number | null,
  responseMs: number,
  errorCode: CommunityProviderErrorCode,
  message: string,
  fields: string[],
): Extract<CommunityProviderResult<T>, { ok: false }> {
  return {
    ok: false,
    endpoint,
    status,
    responseMs,
    errorCode,
    message,
    fields,
  };
}

function mapHttpError(status: number): CommunityProviderErrorCode {
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 404) return "PLAYER_NOT_FOUND";
  if (status >= 500) return "PROVIDER_UNAVAILABLE";
  return "PROVIDER_ERROR";
}

function isEmptyProviderBody(body: unknown) {
  if (!body) return true;
  if (typeof body === "string") return body.trim().length === 0;
  if (Array.isArray(body)) return body.length === 0;
  if (typeof body === "object") return Object.keys(body).length === 0;
  return false;
}

function getErrorMessage(body: unknown) {
  if (typeof body === "string") return body.slice(0, 160);
  const record = getRecord(body);
  const message = record.message || record.error || record.detail;
  return typeof message === "string" ? message.slice(0, 160) : "Provider returned an error.";
}

function getUnknownErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown provider error.";
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function getString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return null;
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function getFreeFireAvatarUrl(avatarId: string | null | undefined): string | null {
  if (!avatarId) return null;
  return `/api/ff-image?itemID=${encodeURIComponent(avatarId)}`;
}

function collectFieldNames(value: unknown, prefix = "", fields = new Set<string>()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [...fields].slice(0, 100);
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const fieldName = prefix ? `${prefix}.${key}` : key;
    fields.add(fieldName);

    if (nestedValue && typeof nestedValue === "object" && !Array.isArray(nestedValue)) {
      collectFieldNames(nestedValue, fieldName, fields);
    }
  }

  return [...fields].slice(0, 100);
}
