"use client";

import type { ReactNode } from "react";
import { Coins, ShieldCheck, Swords, Trophy } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";
import { GamingShell } from "@/components/GamingShell";

type AuthFormWrapperProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthFormWrapper({ title, subtitle, children }: AuthFormWrapperProps) {
  return (
    <GamingShell>
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8">
        <section className="hidden lg:block">
          <StatusBadge tone="orange">Champions League PVP</StatusBadge>
          <h1 className="mt-5 max-w-2xl text-5xl font-black leading-tight tracking-tight text-white">
            Entrá a la arena competitiva de Free Fire.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-neutral-300">
            Torneos, salas privadas, ranking semanal y economía de Coins en una experiencia competitiva lista para presentar.
          </p>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-neutral-900/75 p-4">
              <Trophy className="size-5 text-yellow-200" />
              <p className="mt-3 text-sm font-bold text-white">Rankings</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-neutral-900/75 p-4">
              <Coins className="size-5 text-orange-200" />
              <p className="mt-3 text-sm font-bold text-white">Coins</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-neutral-900/75 p-4">
              <ShieldCheck className="size-5 text-emerald-200" />
              <p className="mt-3 text-sm font-bold text-white">UID</p>
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-orange-600 shadow-xl shadow-orange-950/40">
                <Swords className="size-7 text-white" />
              </div>
              <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-orange-200">Champions League PVP</p>
              <p className="mt-1 text-sm text-neutral-500">Champions League PVP</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-neutral-900/90 p-6 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="mb-5">
                <h2 className="text-2xl font-black tracking-tight text-white">{title}</h2>
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
