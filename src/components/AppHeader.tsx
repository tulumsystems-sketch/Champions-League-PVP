"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Trophy, UserRound } from "lucide-react";

import { LogoutButton } from "@/components/LogoutButton";
import { cn } from "@/lib/utils";

const HIDDEN_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/register/completion"];

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Trophy },
  { href: "/profile", label: "Perfil", icon: UserRound },
];

export function AppHeader() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/90 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3 font-black text-white">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-600 shadow-lg shadow-orange-950/40">
            <Swords className="size-4" />
          </span>
          <span className="hidden truncate text-sm uppercase tracking-[0.2em] sm:block">Champions League PVP</span>
        </Link>

        <nav className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-neutral-400 transition hover:bg-white/10 hover:text-white",
                  active && "bg-white text-neutral-950 hover:bg-white hover:text-neutral-950",
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
