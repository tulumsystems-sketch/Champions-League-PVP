"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Coins, ShieldCheck, Trophy } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";
import { BrandMark } from "@/components/hud/BrandMark";
import { GamingShell } from "@/components/GamingShell";
import { StaggerIn } from "@/components/motion/StaggerIn";

type AuthFormWrapperProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthFormWrapper({ title, subtitle, children }: AuthFormWrapperProps) {
  return (
    <GamingShell>
      <div className="mx-auto grid min-h-screen max-w-7xl items-start gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_460px] lg:items-center lg:px-8">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <BrandMark />
            <span className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-white">Champions League PVP</span>
          </Link>
          <StatusBadge tone="orange" className="mt-8">
            Arena competitiva
          </StatusBadge>
          <h1 className="mt-5 max-w-2xl font-heading text-5xl font-bold leading-[1.02] tracking-tight text-white">
            Entrá a la arena competitiva de Free Fire.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-neutral-300">
            Torneos, salas privadas, ranking y economía de Coins. Misma lógica, ahora con HUD de combate.
          </p>
          <StaggerIn className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <div className="arena-stat">
              <Trophy className="size-5 text-amber-300" />
              <p className="mt-3 text-sm font-bold text-white">Rankings</p>
            </div>
            <div className="arena-stat">
              <Coins className="size-5 text-orange-300" />
              <p className="mt-3 text-sm font-bold text-white">Coins</p>
            </div>
            <div className="arena-stat">
              <ShieldCheck className="size-5 text-emerald-300" />
              <p className="mt-3 text-sm font-bold text-white">UID</p>
            </div>
          </StaggerIn>
        </section>

        <section className="w-full min-w-0">
          <div className="mx-auto w-full min-w-0 max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <Link href="/" className="inline-flex">
                <BrandMark size="lg" />
              </Link>
              <p className="mt-4 arena-kicker text-orange-300">Champions League PVP</p>
              <p className="mt-1 text-sm text-neutral-500">Arena competitiva</p>
            </div>

            <div className="arena-panel p-6">
              <div className="mb-5">
                <h2 className="font-heading text-2xl font-bold tracking-tight text-white">{title}</h2>
                {subtitle && <p className="mt-1 text-sm leading-6 text-neutral-400">{subtitle}</p>}
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </GamingShell>
  );
}
