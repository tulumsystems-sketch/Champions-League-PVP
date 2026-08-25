"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coins,
  Crosshair,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Swords,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

import { LogoutButton } from "@/components/LogoutButton";
import { GamingShell } from "@/components/GamingShell";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getInitials, getProfileName, isAdmin } from "@/lib/profile";
import { getOrCreateWallet, type Wallet } from "@/lib/wallet";
import { subscribeRealtime } from "@/lib/realtime";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  auth: AuthenticatedProfile;
  children: ReactNode;
};

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Desafíos", href: "/challenges", icon: Crosshair },
  { name: "Salas Privadas", href: "/rooms", icon: UsersRound, badge: "Arena" },
  { name: "Ranking", href: "/ranking", icon: Trophy, badge: "Top" },
  { name: "Wallet & Coins", href: "/wallet", icon: WalletCards },
  { name: "Perfil de Jugador", href: "/profile", icon: UserRound },
];

export function AppLayout({ auth, children }: AppLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  const displayName = getProfileName(auth.profile, auth.user);
  const initials = getInitials(displayName) || "P";
  const items = isAdmin(auth.profile)
    ? [...navigation, { name: "Panel Admin", href: "/admin", icon: ShieldCheck, badge: "Ops" }]
    : navigation;

  useEffect(() => {
    let active = true;
    const loadWallet = () => {
      getOrCreateWallet(auth.user.id)
        .then((w) => {
          if (active) setWallet(w);
        })
        .catch(() => {});
    };
    loadWallet();
    const unsubscribe = subscribeRealtime(`wallet-nav:${auth.user.id}`, ["wallets", "wallet_transactions"], loadWallet);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth.user.id]);

  return (
    <GamingShell>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-white/10 lg:bg-neutral-950/90 lg:backdrop-blur-2xl">
          <div className="flex h-20 items-center gap-3 px-6 border-b border-white/10">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl shadow-orange-950/50">
              <Swords className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400">Champions League</p>
              <h2 className="text-base font-black tracking-tight text-white">PVP ARENA</h2>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
            <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Navegación principal</p>
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all",
                    isActive
                      ? "bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-950/40"
                      : "text-neutral-400 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-neutral-400")} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                        isActive ? "bg-black/20 text-white" : "bg-white/10 text-orange-300",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile Footer in Sidebar */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/80 p-3 shadow-inner">
              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-500/30 to-cyan-500/20 text-sm font-black text-white">
                {auth.profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={auth.profile.avatar_url} alt={displayName} className="size-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-white">{displayName}</p>
                <p className="truncate text-xs font-semibold text-emerald-400">
                  {wallet ? `${wallet.balance} Coins` : "Wallet"}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Main Content without top header bar on desktop */}
        <div className="flex flex-1 flex-col lg:pl-72">
          {/* Mobile hamburger header button only */}
          <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-neutral-950/90 px-4 backdrop-blur-xl lg:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-xl border border-white/10 bg-neutral-900 p-2.5 text-neutral-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-orange-600 text-white shadow-md">
                  <Swords className="size-4" />
                </span>
                <span className="font-black tracking-tight text-white">Champions PVP</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/wallet"
                className="flex items-center gap-2 rounded-xl border border-orange-400/30 bg-orange-500/10 px-3 py-1.5 text-orange-200"
              >
                <Coins className="size-4 text-orange-400" />
                <span className="text-xs font-black">{wallet ? `${wallet.balance} Coins` : "Wallet"}</span>
              </Link>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="fixed inset-x-0 top-16 z-50 border-b border-white/10 bg-neutral-950/95 p-4 backdrop-blur-2xl lg:hidden shadow-2xl">
              <nav className="space-y-1.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition",
                        isActive ? "bg-orange-600 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-5" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase text-orange-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-4 border-t border-white/10 pt-4">
                <LogoutButton />
              </div>
            </div>
          )}

          {/* Main Content View */}
          <main className="flex-1 pb-16 lg:pb-0">{children}</main>
        </div>
      </div>
    </GamingShell>
  );
}
