export const AUTH_CALLBACK_PATH = "/auth/callback";
export const RESET_PASSWORD_PATH = "/reset-password";
export const PASSWORD_RECOVERY_INTENT_KEY = "clpvp-password-recovery";

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getSiteUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return normalizeSiteUrl(fromEnv);
  return "http://localhost:3000";
}

export function getAuthCallbackUrl() {
  return `${getSiteUrl()}${AUTH_CALLBACK_PATH}`;
}

export function getAuthRedirectUrl(nextPath = "/dashboard") {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${getAuthCallbackUrl()}?next=${encodeURIComponent(next)}`;
}

export function markPasswordRecoveryIntent() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PASSWORD_RECOVERY_INTENT_KEY, "1");
}

export function consumePasswordRecoveryIntent() {
  if (typeof window === "undefined") return false;
  const marked = sessionStorage.getItem(PASSWORD_RECOVERY_INTENT_KEY) === "1";
  sessionStorage.removeItem(PASSWORD_RECOVERY_INTENT_KEY);
  return marked;
}

export function parseAuthRedirect(href: string) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const pick = (key: string) => url.searchParams.get(key) || hash.get(key);
  const rawError = pick("error_description") || pick("error");

  return {
    code: url.searchParams.get("code"),
    tokenHash: pick("token_hash"),
    next: pick("next") || "/dashboard",
    type: pick("type"),
    error: rawError ? decodeURIComponent(rawError.replace(/\+/g, " ")) : null,
  };
}

export function isPasswordRecoveryRedirect(href: string, recoveryIntent = false) {
  const { next, type, tokenHash } = parseAuthRedirect(href);
  return recoveryIntent || type === "recovery" || Boolean(tokenHash && type === "recovery") || next === RESET_PASSWORD_PATH;
}
