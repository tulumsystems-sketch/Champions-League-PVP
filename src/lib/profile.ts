import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type PlayerProfile = {
  id: string;
  email: string | null;
  provider: string | null;
  nickname: string | null;
  avatar_url: string | null;
  freefire_uid: string | null;
  freefire_region: string | null;
  freefire_level: number | null;
  freefire_likes: number | null;
  freefire_rank: number | null;
  clan_name: string | null;
  signature: string | null;
  role: string | null;
  status: string | null;
  created_at: string | null;
};

export type AuthenticatedProfile = {
  user: User;
  profile: PlayerProfile | null;
};

export const PROFILE_SELECT =
  "id, email, provider, nickname, avatar_url, freefire_uid, freefire_region, freefire_level, freefire_likes, freefire_rank, clan_name, signature, role, status, created_at";

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

export function isProfileActive(profile: PlayerProfile | null) {
  return getProfileStatus(profile) === "active";
}

export function isAdmin(profile: PlayerProfile | null) {
  return profile?.role === "admin";
}

export function isDuplicateUidError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("profiles_freefire_uid_unique") || normalized.includes("duplicate key");
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export async function ensurePlayerProfile(user: User) {
  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existing) {
    return existing as PlayerProfile;
  }

  const meta = user.user_metadata || {};
  const email = user.email || null;
  const nickname =
    String(meta.nickname || meta.full_name || meta.name || "")
      .trim() || email?.split("@")[0] || "Jugador";
  const provider = user.app_metadata?.provider === "google" ? "google" : String(meta.provider || "email");

  const { error: upsertError } = await supabase.from("profiles").upsert(
    [
      {
        id: user.id,
        email,
        provider,
        nickname,
        freefire_uid: typeof meta.freefire_uid === "string" ? meta.freefire_uid.trim() || null : null,
        freefire_region: typeof meta.freefire_region === "string" ? meta.freefire_region : null,
        avatar_url: typeof meta.avatar_url === "string" ? meta.avatar_url : null,
        status: "active",
        created_at: new Date().toISOString(),
      },
    ],
    { onConflict: "id" },
  );

  if (upsertError) {
    throw new Error(
      isDuplicateUidError(upsertError.message)
        ? "Ese UID de Free Fire ya está vinculado a otra cuenta."
        : upsertError.message,
    );
  }

  const { data: created, error: createdError } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (createdError) {
    throw new Error(createdError.message);
  }

  return (created || null) as PlayerProfile | null;
}
