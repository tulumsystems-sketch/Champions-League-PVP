export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function getAuthRedirectUrl(nextPath = "/dashboard") {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}
