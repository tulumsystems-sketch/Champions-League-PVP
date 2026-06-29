import type { User } from "@supabase/supabase-js";

export type PlayerProfile = {
  id: string;
  email: string | null;
  provider: string | null;
  nickname: string | null;
  avatar_url: string | null;
  freefire_uid: string | null;
  status: string | null;
  created_at: string | null;
};

export type AuthenticatedProfile = {
  user: User;
  profile: PlayerProfile | null;
};

export const PROFILE_SELECT = "id, email, provider, nickname, avatar_url, freefire_uid, status, created_at";

export function isProfileComplete(profile: PlayerProfile | null) {
  return Boolean(profile?.freefire_uid?.trim());
}

export function getProfileName(profile: PlayerProfile | null, user?: User | null) {
  return profile?.nickname?.trim() || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Jugador";
}

export function getProfileEmail(profile: PlayerProfile | null, user?: User | null) {
  return profile?.email || user?.email || "Sin email";
}

export function getProfileUid(profile: PlayerProfile | null) {
  return profile?.freefire_uid?.trim() || "Pendiente";
}

export function getProfileStatus(profile: PlayerProfile | null) {
  return profile?.status || "active";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
