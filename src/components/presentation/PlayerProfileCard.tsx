import Link from "next/link";
import { ShieldCheck, UserRound } from "lucide-react";

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
    <aside className="rounded-lg border border-white/10 bg-neutral-900/80 p-5 shadow-2xl shadow-black/25">
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-500/30 to-cyan-500/20 text-xl font-black text-white shadow-lg shadow-orange-950/30">
          {auth.profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={auth.profile.avatar_url} alt={displayName} className="size-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-black text-white">{displayName}</h2>
            <StatusBadge tone={status === "active" ? "emerald" : "red"}>{status}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-neutral-400">UID Free Fire: {freefireUid}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-neutral-500">Email</p>
          <p className="mt-1 truncate font-bold text-cyan-100">{getProfileEmail(auth.profile, auth.user)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-neutral-500">Provider</p>
          <p className="mt-1 font-bold text-white">{auth.profile?.provider || "email"}</p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3">
        <ShieldCheck className="mt-0.5 size-5 text-emerald-300" />
        <div>
          <p className="font-semibold text-emerald-100">Perfil competitivo</p>
          <p className="text-sm text-emerald-100/70">
            {auth.profile?.freefire_uid ? "Listo para salas y desafíos." : "Completá tu UID para activar tu perfil."}
          </p>
        </div>
      </div>

      {showAction && (
        <Link
          href="/profile"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-neutral-950 transition hover:bg-orange-100"
        >
          <UserRound className="size-4" />
          Ver perfil
        </Link>
      )}
    </aside>
  );
}
