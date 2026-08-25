"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords } from "lucide-react";

import { LogoutButton } from "@/components/LogoutButton";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getInitials, getProfileName } from "@/lib/profile";
import { COMING_SOON_NAV, isNavActive, MAIN_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  auth: AuthenticatedProfile;
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebar({ auth, onNavigate, className }: AppSidebarProps) {
  const pathname = usePathname();
  const displayName = getProfileName(auth.profile, auth.user);
  const initials = getInitials(displayName) || "P";

  return (
    <aside className={cn("flex h-full flex-col border-r border-white/10 bg-neutral-950/95", className)}>
      <div className="border-b border-white/10 p-5">
        <Link href="/dashboard" onClick={onNavigate} className="flex items-center gap-3 font-black text-white">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-600 shadow-lg shadow-orange-950/40">
            <Swords className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs uppercase tracking-[0.2em] text-neutral-500">Arena</p>
            <p className="truncate text-sm font-black">Champions League</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        <NavGroup label="Principal" items={MAIN_NAV} pathname={pathname} onNavigate={onNavigate} />
        {COMING_SOON_NAV.length > 0 && (
          <NavGroup label="Próximamente" items={COMING_SOON_NAV} pathname={pathname} onNavigate={onNavigate} disabledGroup />
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-500/30 to-cyan-500/20 text-sm font-black text-white">
            {auth.profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={auth.profile.avatar_url} alt={displayName} className="size-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
            <p className="truncate text-xs text-neutral-500">{auth.profile?.freefire_uid ? `UID ${auth.profile.freefire_uid}` : "UID pendiente"}</p>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  onNavigate,
  disabledGroup = false,
}: {
  label: string;
  items: typeof MAIN_NAV;
  pathname: string;
  onNavigate?: () => void;
  disabledGroup?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-600">{label}</p>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = !item.disabled && isNavActive(pathname, item.href);

          if (item.disabled || disabledGroup) {
            return (
              <li key={item.label}>
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-600">
                  <Icon className="size-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                  </div>
                  {item.badge && (
                    <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      {item.badge}
                    </span>
                  )}
                </div>
              </li>
            );
          }

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition",
                  active
                    ? "bg-orange-600 text-white shadow-lg shadow-orange-950/30"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.label}</p>
                  {item.description && active && <p className="truncate text-xs text-orange-100/70">{item.description}</p>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
