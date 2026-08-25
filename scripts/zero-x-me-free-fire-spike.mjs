import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

const DEFAULT_BASE_URL = "https://freefire-api-six.vercel.app";
const TIMEOUT_MS = 8000;

loadDotEnvLocal();

const uid = process.argv[2]?.trim();
const server = (process.argv[3]?.trim() || "BR").toUpperCase();
const baseUrl = (process.env.FREE_FIRE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");

if (!uid || !/^\d{6,}$/.test(uid)) {
  console.error("INVALID_UID: pass a numeric UID with at least 6 digits.");
  console.error("Usage: node scripts/zero-x-me-free-fire-spike.mjs <uid-real> [server]");
  process.exit(1);
}

const endpoints = [
  `/get_player_personal_show?server=${encodeURIComponent(server)}&uid=${encodeURIComponent(uid)}`,
  `/get_player_stats?server=${encodeURIComponent(server)}&uid=${encodeURIComponent(uid)}&matchmode=CAREER&gamemode=br`,
  `/get_player_stats?server=${encodeURIComponent(server)}&uid=${encodeURIComponent(uid)}&matchmode=RANKED&gamemode=br`,
];

console.log("0xMe FreeFire-Api spike");
console.log(`UID: ${uid}`);
console.log(`Server: ${server}`);
console.log(`Base URL: ${baseUrl}`);

const results = [];

for (const endpoint of endpoints) {
  const result = await requestEndpoint(endpoint);
  results.push(result);
  printResult(result);
}

if (!results.some((result) => result.ok)) {
  process.exitCode = 1;
}

async function requestEndpoint(endpoint) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });
    const responseMs = Math.round(performance.now() - startedAt);
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    const fields = collectFieldNames(body);

    return {
      ok: response.ok && !isEmptyProviderBody(body),
      endpoint,
      status: response.status,
      responseMs,
      fields,
      extracted: extractKnownFields(endpoint, body),
      errorHint: response.ok ? null : getErrorMessage(body),
    };
  } catch (error) {
    const responseMs = Math.round(performance.now() - startedAt);
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return {
      ok: false,
      endpoint,
      status: isTimeout ? "TIMEOUT" : "REQUEST_FAILED",
      responseMs,
      fields: [],
      extracted: {},
      errorHint: isTimeout ? "Request timed out after 8 seconds." : getUnknownErrorMessage(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function printResult(result) {
  console.log(`\nEndpoint: GET ${result.endpoint}`);
  console.log(`HTTP status: ${result.status}`);
  console.log(`Response time: ${result.responseMs}ms`);
  console.log(`Fields: ${result.fields.length ? result.fields.join(", ") : "none detected"}`);
  console.log(`Extracted fields: ${Object.keys(result.extracted).length ? Object.keys(result.extracted).join(", ") : "none"}`);

  if (result.errorHint) {
    console.log(`Provider error hint: ${result.errorHint}`);
  }
}

function extractKnownFields(endpoint, body) {
  if (endpoint.includes("get_player_personal_show")) {
    const basicInfo = getRecord(getRecord(body).basicinfo);

    return dropNullish({
      "basicinfo.accountid": getPrimitive(basicInfo.accountid),
      "basicinfo.nickname": getPrimitive(basicInfo.nickname),
      "basicinfo.region": getPrimitive(basicInfo.region),
      "basicinfo.level": getPrimitive(basicInfo.level),
      "basicinfo.rank": getPrimitive(basicInfo.rank),
      "basicinfo.rankingpoints": getPrimitive(basicInfo.rankingpoints),
      "basicinfo.csrank": getPrimitive(basicInfo.csrank),
      "basicinfo.csrankingpoints": getPrimitive(basicInfo.csrankingpoints),
      "basicinfo.liked": getPrimitive(basicInfo.liked),
      "basicinfo.lastloginat": getPrimitive(basicInfo.lastloginat),
      "basicinfo.createat": getPrimitive(basicInfo.createat),
    });
  }

  const record = getRecord(body);
  const extracted = {};

  for (const [bucketName, bucketValue] of Object.entries(record)) {
    const normalizedBucketName = bucketName.toLowerCase();
    if (!["solo", "duo", "squad", "quad"].some((name) => normalizedBucketName.includes(name))) continue;

    const bucket = getRecord(bucketValue);
    const detailedStats = getRecord(bucket.detailedstats);

    Object.assign(
      extracted,
      dropNullish({
        [`${bucketName}.gamesplayed`]: getPrimitive(bucket.gamesplayed),
        [`${bucketName}.wins`]: getPrimitive(bucket.wins),
        [`${bucketName}.kills`]: getPrimitive(bucket.kills),
        [`${bucketName}.detailedstats.damage`]: getPrimitive(detailedStats.damage),
        [`${bucketName}.detailedstats.headshots`]: getPrimitive(detailedStats.headshots),
        [`${bucketName}.detailedstats.headshotkills`]: getPrimitive(detailedStats.headshotkills),
        [`${bucketName}.detailedstats.deaths`]: getPrimitive(detailedStats.deaths),
        [`${bucketName}.detailedstats.topntimes`]: getPrimitive(detailedStats.topntimes),
      }),
    );
  }

  return extracted;
}

function collectFieldNames(value, prefix = "", fields = new Set()) {
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

function isEmptyProviderBody(body) {
  if (!body) return true;
  if (typeof body === "string") return body.trim().length === 0;
  if (Array.isArray(body)) return body.length === 0;
  if (typeof body === "object") return Object.keys(body).length === 0;
  return false;
}

function getErrorMessage(body) {
  if (typeof body === "string") return body.slice(0, 160);

  const record = getRecord(body);
  const message = record.message || record.error || record.detail;
  return typeof message === "string" ? message.slice(0, 160) : "Provider returned an error.";
}

function getUnknownErrorMessage(error) {
  return error instanceof Error ? error.message : "Unknown request error.";
}

function getRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getPrimitive(value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return null;
}

function dropNullish(record) {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null && value !== undefined));
}

function loadDotEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
