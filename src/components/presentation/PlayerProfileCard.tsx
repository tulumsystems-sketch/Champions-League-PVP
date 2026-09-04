"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";

import { PlayerUltimateCard } from "@/components/presentation/PlayerUltimateCard";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getInitials, getProfileEmail, getProfileName, getProfileStatus, getProfileUid } from "@/lib/profile";

export function PlayerProfileCard({
  auth,
  showAction = true,
}: {
  auth: AuthenticatedProfile;
  showAction?: boolean;
}) {
  const displayName = getProfileName(auth.profile, auth.user);
  const freefireUid = getProfileUid(auth.profile);
  const initials = getInitials(displayName) || "P";
  const status = getProfileStatus(auth.profile);

  return (
    <aside className="space-y-4">
      <PlayerUltimateCard
        player={{
          name: displayName,
          avatarUrl: auth.profile?.avatar_url,
          initials,
          uid: freefireUid,
          region: auth.profile?.freefire_region,
          clan: auth.profile?.clan_name,
          level: auth.profile?.freefire_level,
          rank: auth.profile?.freefire_rank,
          likes: auth.profile?.freefire_likes,
          position: "FF",
        }}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <StatusBadge tone={status === "active" ? "emerald" : "red"}>
          {status === "active" ? "Activo" : "Suspendido"}
        </StatusBadge>
        <p className="truncate text-xs text-neutral-500">{getProfileEmail(auth.profile, auth.user)}</p>
      </div>
      {showAction && (
        <Link href="/profile" className="arena-btn w-full">
          <UserRound className="size-4" />
          Ver perfil
        </Link>
      )}
    </aside>
  );
}
