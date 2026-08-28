"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, X } from "lucide-react";
import gsap from "gsap";

import { LogoutButton } from "@/components/LogoutButton";
import { GamingShell } from "@/components/GamingShell";
import { BrandMark } from "@/components/hud/BrandMark";
import { LivePulse } from "@/components/hud/LivePulse";
import { CoinChip } from "@/components/motion/CoinChip";
import { PageEnter } from "@/components/motion/PageEnter";
import { PlayerAvatar } from "@/components/motion/PlayerAvatar";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getInitials, getProfileName, isAdmin } from "@/lib/profile";
import { DOCK_NAV, MAIN_NAV, isNavActive, type NavItem } from "@/lib/navigation";
import { getOrCreateWallet, type Wallet } from "@/lib/wallet";
import { subscribeRealtime } from "@/lib/realtime";
import { cn } from "@/lib/utils";

type AppLayoutProps = {
  auth: AuthenticatedProfile;
  children: ReactNode;
};

export function AppLayout({ auth, children }: AppLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const displayName = getProfileName(auth.profile, auth.user);
  const initials = getInitials(displayName) || "P";
  const items: NavItem[] = isAdmin(auth.profile)
    ? [...MAIN_NAV, { href: "/admin", label: "Admin", icon: ShieldCheck, badge: "Ops" }]
    : MAIN_NAV;

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

  useEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;
    const activeLink = nav.querySelector<HTMLElement>("[data-active='true']");
    if (!activeLink) {
      gsap.to(indicator, { autoAlpha: 0, duration: 0.2 });
      return;
    }
    gsap.to(indicator, {
      autoAlpha: 1,
      y: activeLink.offsetTop,
      height: activeLink.offsetHeight,
      duration: 0.32,
      ease: "power3.out",
    });
  }, [pathname, items.length]);

  return (
    <GamingShell>
      <div className="flex min-h-screen">
        <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[16.75rem] lg:flex-col lg:border-r lg:border-white/8 lg:bg-[#07080e]/90 lg:backdrop-blur-2xl">
          <Link href="/dashboard" className="flex h-[4.6rem] items-center gap-3 border-b border-white/8 px-5">
            <BrandMark size="sm" />
            <div>
              <p className="arena-kicker text-orange-300">Champions League</p>
              <h2 className="font-heading text-base font-bold text-white">PVP ARENA</h2>
            </div>
          </Link>

          <nav ref={navRef} className="relative flex-1 space-y-1 overflow-y-auto px-3 py-5">
            <span
              ref={indicatorRef}
              className="pointer-events-none absolute left-3 right-3 rounded-xl bg-gradient-to-r from-orange-600/95 to-orange-500/90 shadow-[0_10px_24px_rgba(255,83,24,0.28)]"
            />
            <p className="arena-kicker relative z-10 px-3 pb-3">Navegación</p>
            {items.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={active}
                  className={cn(
                    "group relative z-10 flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors",
                    active ? "text-white" : "text-neutral-400 hover:text-white",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-4 transition-transform duration-200 group-hover:scale-110", active ? "text-white" : "text-neutral-500")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider",
                        active ? "bg-black/20 text-white" : "bg-cyan-400/10 text-cyan-200",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/8 bg-black/25 p-4">
            <Link href="/profile" className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#12121a] p-3 transition hover:border-orange-400/30">
              <PlayerAvatar src={auth.profile?.avatar_url} name={displayName} initials={initials} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{displayName}</p>
                <CoinChip balance={wallet ? Number(wallet.balance) : null} className="mt-1 px-2 py-0.5" />
              </div>
            </Link>
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:pl-[16.75rem]">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-[#05060a]/88 px-4 backdrop-blur-xl">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-xl border border-white/10 bg-[#12121a] p-2.5 text-neutral-300 hover:text-white"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
              <Link href="/dashboard" className="flex items-center gap-2">
                <BrandMark size="sm" />
                <span className="font-heading font-bold tracking-tight text-white">Champions PVP</span>
              </Link>
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <LivePulse label="Arena online" />
              <p className="text-xs text-neutral-500">HUD competitivo · Free Fire</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/wallet">
                <CoinChip balance={wallet ? Number(wallet.balance) : null} />
              </Link>
              <Link href="/profile" className="lg:hidden">
                <PlayerAvatar src={auth.profile?.avatar_url} name={displayName} initials={initials} size="sm" />
              </Link>
            </div>
          </header>

          {mobileMenuOpen && (
            <div className="fixed inset-x-0 top-16 z-50 border-b border-white/10 bg-[#07070b]/96 p-4 shadow-2xl backdrop-blur-2xl lg:hidden">
              <nav className="space-y-1.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition",
                        active ? "bg-orange-600 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="rounded-md bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-200">
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

          <main className="flex-1 pb-24 lg:pb-0">
            <PageEnter replayKey={pathname}>{children}</PageEnter>
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07080e]/94 px-2 py-2 backdrop-blur-xl lg:hidden">
        <ul className="mx-auto flex max-w-lg items-stretch justify-around">
          {DOCK_NAV.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold uppercase tracking-wide transition",
                    active ? "text-orange-300" : "text-neutral-500",
                  )}
                >
                  <Icon className={cn("size-5", active && "text-orange-400 drop-shadow-[0_0_8px_rgba(255,83,24,0.7)]")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </GamingShell>
  );
}
