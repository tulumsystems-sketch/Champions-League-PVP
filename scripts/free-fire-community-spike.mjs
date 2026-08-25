import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "https://developers.freefirecommunity.com/api/v1";
const TIMEOUT_MS = 8000;

loadDotEnvLocal();

const uid = process.argv[2]?.trim();
const region = (process.argv[3]?.trim() || "BR").toUpperCase();
const apiKey = process.env.FREE_FIRE_API_KEY;

if (!uid || !/^\d{6,}$/.test(uid)) {
  console.error("INVALID_UID: pass a numeric UID with at least 6 digits.");
  console.error("Usage: node scripts/free-fire-community-spike.mjs <uid> [region]");
  process.exit(1);
}

if (!apiKey) {
  console.error("CONFIGURATION_ERROR: FREE_FIRE_API_KEY is missing. The API key was not printed.");
  process.exit(1);
}

console.log(`Free Fire Community API spike`);
console.log(`UID: ${uid}`);
console.log(`Region: ${region}`);

const info = await requestProvider("info", uid, region, apiKey);
const stats = await requestProvider("stats", uid, region, apiKey);

printResult("info", info);
printResult("stats", stats);

if (!info.ok && !stats.ok) {
  process.exitCode = 1;
}

async function requestProvider(endpoint, playerUid, playerRegion, key) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const url = `${BASE_URL}/${endpoint}?region=${encodeURIComponent(playerRegion)}&uid=${encodeURIComponent(playerUid)}&key=${encodeURIComponent(key)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": key,
        accept: "application/json",
      },
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      fieldNames: collectFieldNames(body),
      errorHint: response.ok ? null : getErrorHint(body),
    };
  } catch (error) {
    return {
      ok: false,
      status: "REQUEST_FAILED",
      statusText: error instanceof Error ? error.message : "Unknown request error",
      fieldNames: [],
      errorHint: error instanceof Error && error.name === "AbortError" ? "Request timed out after 8 seconds." : null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function printResult(endpoint, result) {
  console.log(`\nEndpoint: GET /${endpoint}`);
  console.log(`HTTP status: ${result.status} ${result.statusText || ""}`.trim());
  console.log(`Fields: ${result.fieldNames.length ? result.fieldNames.join(", ") : "none detected"}`);

  if (result.errorHint) {
    console.log(`Provider error hint: ${result.errorHint}`);
  }
}

function collectFieldNames(value, prefix = "", fields = new Set()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [...fields].slice(0, 80);
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const fieldName = prefix ? `${prefix}.${key}` : key;
    fields.add(fieldName);

    if (nestedValue && typeof nestedValue === "object" && !Array.isArray(nestedValue)) {
      collectFieldNames(nestedValue, fieldName, fields);
    }
  }

  return [...fields].slice(0, 80);
}

function getErrorHint(body) {
  if (!body) return null;
  if (typeof body === "string") return body.slice(0, 160);

  const error = body.error || body.message || body.detail;
  return typeof error === "string" ? error.slice(0, 160) : null;
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
