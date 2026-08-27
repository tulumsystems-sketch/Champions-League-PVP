"use client";

import Link from "next/link";
import { ShieldCheck, UserRound } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";
import { PlayerAvatar } from "@/components/motion/PlayerAvatar";
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
    <aside className="arena-panel p-5">
      <div className="flex items-center gap-4">
        <PlayerAvatar src={auth.profile?.avatar_url} name={displayName} initials={initials} size="lg" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate font-heading text-xl font-bold text-white">{displayName}</h2>
            <StatusBadge tone={status === "active" ? "emerald" : "red"}>{status}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-neutral-400">UID Free Fire: {freefireUid}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="arena-stat">
          <p className="arena-kicker">Email</p>
          <p className="mt-1 truncate font-bold text-cyan-100">{getProfileEmail(auth.profile, auth.user)}</p>
        </div>
        <div className="arena-stat">
          <p className="arena-kicker">Provider</p>
          <p className="mt-1 font-bold text-white">{auth.profile?.provider || "email"}</p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
        <ShieldCheck className="mt-0.5 size-5 text-emerald-300" />
        <div>
          <p className="font-semibold text-emerald-100">Perfil competitivo</p>
          <p className="text-sm text-emerald-100/70">
            {auth.profile?.freefire_uid ? "Listo para salas y desafíos." : "Completá tu UID para activar tu perfil."}
          </p>
        </div>
      </div>

      {showAction && (
        <Link href="/profile" className="arena-btn mt-5 w-full">
          <UserRound className="size-4" />
          Ver perfil
        </Link>
      )}
    </aside>
  );
}
