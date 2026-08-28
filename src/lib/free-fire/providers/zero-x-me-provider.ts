const DEFAULT_BASE_URL = "https://freefire-api-six.vercel.app";
const TIMEOUT_MS = 8000;

export type FreeFireProviderErrorCode =
  | "INVALID_UID"
  | "PLAYER_NOT_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_ERROR"
  | "TIMEOUT";

export type ZeroXMeStatsMode = "CAREER" | "RANKED";

export type ZeroXMePersonalShow = {
  accountId: string | null;
  nickname: string | null;
  region: string | null;
  level: number | null;
  rank: number | null;
  rankingPoints: number | null;
  csRank: number | null;
  csRankingPoints: number | null;
  liked: number | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  fields: string[];
};

export type ZeroXMeStatsBucket = {
  gamesPlayed: number | null;
  wins: number | null;
  kills: number | null;
  damage: number | null;
  headshots: number | null;
  headshotKills: number | null;
  deaths: number | null;
  topNTimes: number | null;
  fields: string[];
};

export type ZeroXMeStats = {
  solo: ZeroXMeStatsBucket | null;
  duo: ZeroXMeStatsBucket | null;
  squad: ZeroXMeStatsBucket | null;
  fields: string[];
};

export type ZeroXMeProviderResult<T> =
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
      errorCode: FreeFireProviderErrorCode;
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
      errorCode: FreeFireProviderErrorCode;
      message: string;
      fields: string[];
    };

export async function getZeroXMePlayerPersonalShow(uid: string, server = "BR") {
  const validationError = validateUid(uid);
  const endpoint = `/get_player_personal_show?server=${encodeURIComponent(server)}&uid=${encodeURIComponent(uid)}`;

  if (validationError) {
    return providerError<ZeroXMePersonalShow>(endpoint, null, 0, "INVALID_UID", validationError, []);
  }

  const result = await requestProvider(endpoint);

  if (!result.ok) return result;

  return {
    ok: true,
    endpoint,
    status: result.status,
    responseMs: result.responseMs,
    data: normalizePersonalShow(result.body),
  } satisfies ZeroXMeProviderResult<ZeroXMePersonalShow>;
}

export async function getZeroXMePlayerStats(uid: string, server = "BR", matchmode: ZeroXMeStatsMode = "CAREER") {
  const validationError = validateUid(uid);
  const endpoint = `/get_player_stats?server=${encodeURIComponent(server)}&uid=${encodeURIComponent(
    uid,
  )}&matchmode=${encodeURIComponent(matchmode)}&gamemode=br`;

  if (validationError) {
    return providerError<ZeroXMeStats>(endpoint, null, 0, "INVALID_UID", validationError, []);
  }

  const result = await requestProvider(endpoint);

  if (!result.ok) return result;

  return {
    ok: true,
    endpoint,
    status: result.status,
    responseMs: result.responseMs,
    data: normalizeStats(result.body),
  } satisfies ZeroXMeProviderResult<ZeroXMeStats>;
}

async function requestProvider(endpoint: string): Promise<ProviderRequestResult> {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    const responseMs = Math.round(performance.now() - startedAt);
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    const fields = collectFieldNames(body);

    if (!response.ok) {
      return providerError(endpoint, response.status, responseMs, mapHttpError(response.status), getErrorMessage(body), fields);
    }

    if (isEmptyProviderBody(body)) {
      return providerError(endpoint, response.status, responseMs, "PLAYER_NOT_FOUND", "Player data was not found.", fields);
    }

    return { ok: true as const, status: response.status, responseMs, body };
  } catch (error) {
    const responseMs = Math.round(performance.now() - startedAt);
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return providerError(
      endpoint,
      null,
      responseMs,
      isTimeout ? "TIMEOUT" : "PROVIDER_UNAVAILABLE",
      isTimeout ? "Provider request timed out after 8 seconds." : getUnknownErrorMessage(error),
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
  if (!/^\d{6,}$/.test(uid.trim())) {
    return "UID must be numeric and have at least 6 digits.";
  }

  return null;
}

function normalizePersonalShow(body: unknown): ZeroXMePersonalShow {
  const basicInfo = getRecord(getRecord(body).basicinfo);

  return {
    accountId: getString(basicInfo.accountid),
    nickname: getString(basicInfo.nickname),
    region: getString(basicInfo.region),
    level: getNumber(basicInfo.level),
    rank: getNumber(basicInfo.rank),
    rankingPoints: getNumber(basicInfo.rankingpoints),
    csRank: getNumber(basicInfo.csrank),
    csRankingPoints: getNumber(basicInfo.csrankingpoints),
    liked: getNumber(basicInfo.liked),
    lastLoginAt: getString(basicInfo.lastloginat),
    createdAt: getString(basicInfo.createat),
    fields: collectFieldNames(body),
  };
}

function normalizeStats(body: unknown): ZeroXMeStats {
  const record = getRecord(body);

  return {
    solo: findStatsBucket(record, ["solo"]),
    duo: findStatsBucket(record, ["duo"]),
    squad: findStatsBucket(record, ["squad", "quad"]),
    fields: collectFieldNames(body),
  };
}

function findStatsBucket(record: Record<string, unknown>, names: string[]) {
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase();

    if (names.some((name) => normalizedKey.includes(name))) {
      return normalizeStatsBucket(value);
    }
  }

  return null;
}

function normalizeStatsBucket(value: unknown): ZeroXMeStatsBucket {
  const record = getRecord(value);
  const detailedStats = getRecord(record.detailedstats);

  return {
    gamesPlayed: getNumber(record.gamesplayed),
    wins: getNumber(record.wins),
    kills: getNumber(record.kills),
    damage: getNumber(detailedStats.damage),
    headshots: getNumber(detailedStats.headshots),
    headshotKills: getNumber(detailedStats.headshotkills),
    deaths: getNumber(detailedStats.deaths),
    topNTimes: getNumber(detailedStats.topntimes),
    fields: collectFieldNames(value),
  };
}

function providerError<T>(
  endpoint: string,
  status: number | null,
  responseMs: number,
  errorCode: FreeFireProviderErrorCode,
  message: string,
  fields: string[],
): Extract<ZeroXMeProviderResult<T>, { ok: false }> {
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

function mapHttpError(status: number): FreeFireProviderErrorCode {
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
