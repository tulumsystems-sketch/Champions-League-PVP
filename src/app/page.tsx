"use client";

import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Crosshair,
  Crown,
  Gamepad2,
  ShieldCheck,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { FeatureCard } from "@/components/presentation/FeatureCard";
import { StatCard } from "@/components/presentation/StatCard";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { BrandMark } from "@/components/hud/BrandMark";
import { LivePulse } from "@/components/hud/LivePulse";
import { GamingShell } from "@/components/GamingShell";
import { StaggerIn } from "@/components/motion/StaggerIn";

const landingFeatures = [
  {
    title: "Desafíos PvP",
    description: "Competencias temporales con reglas claras, cupos limitados y premios visibles.",
    href: "/challenges",
    accent: "orange" as const,
    icon: Crosshair,
  },
  {
    title: "Salas privadas",
    description: "Modos 1 vs 1, 2 vs 2, 3 vs 3 y 4 vs 4 con entrada en Coins y validación de resultado.",
    href: "/rooms",
    accent: "cyan" as const,
    icon: UsersRound,
  },
  {
    title: "Ranking competitivo",
    description: "Leaderboard de la arena: victorias, puntos y Coins ganadas.",
    href: "/ranking",
    accent: "emerald" as const,
    icon: Trophy,
  },
  {
    title: "Wallet de Coins",
    description: "Balance, recargas, retiros y movimientos. 1 Coin = 1 USD.",
    href: "/wallet",
    accent: "yellow" as const,
    icon: WalletCards,
  },
  {
    title: "Perfil Free Fire",
    description: "UID, nickname, avatar y estado de verificación del jugador.",
    href: "/profile",
    accent: "red" as const,
    icon: UserRound,
  },
];

export default function HomePage() {
  return (
    <GamingShell>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-12%] top-[-20%] size-[520px] rounded-full bg-orange-500/18 blur-[120px]" />
          <div className="absolute right-[-8%] top-[10%] size-[420px] rounded-full bg-cyan-400/12 blur-[110px]" />
          <div className="absolute bottom-[-20%] left-1/3 size-[380px] rounded-full bg-amber-400/8 blur-[100px]" />
        </div>

        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 font-heading font-bold text-white">
              <BrandMark />
              <span className="text-sm uppercase tracking-[0.22em] sm:text-base">Champions League PVP</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login" className="arena-btn-ghost hidden sm:inline-flex">
                Ingresar
              </Link>
              <Link href="/register" className="arena-btn">
                Crear cuenta
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </nav>

          <div className="flex flex-1 items-center py-14">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="orange">Arena competitiva</StatusBadge>
                <LivePulse label="Online" />
              </div>
              <h1 className="mt-6 max-w-4xl font-heading text-5xl font-bold leading-[0.94] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Champions League{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-cyan-300">
                  PVP
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-200 sm:text-xl">
                Torneos, salas privadas, ranking y Coins. Entrá, competí y cobrá. La arena ya está en línea.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className="arena-btn">
                  Entrar a la plataforma
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/register" className="arena-btn-ghost">
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>

          <StaggerIn className="grid gap-3 pb-8 sm:grid-cols-3">
            <div className="arena-stat">
              <p className="arena-kicker">Proyección</p>
              <p className="mt-2 font-heading text-3xl font-bold text-white">+300</p>
              <p className="text-sm text-neutral-400">jugadores</p>
            </div>
            <div className="arena-stat">
              <p className="arena-kicker">Economía</p>
              <p className="mt-2 font-heading text-3xl font-bold text-amber-200">Coins</p>
              <p className="text-sm text-neutral-400">1 Coin = 1 USD</p>
            </div>
            <div className="arena-stat">
              <p className="arena-kicker">Modos</p>
              <p className="mt-2 font-heading text-3xl font-bold text-cyan-200">PvP</p>
              <p className="text-sm text-neutral-400">desafíos y salas</p>
            </div>
          </StaggerIn>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#07080e]/80 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <StatusBadge tone="cyan">Módulos</StatusBadge>
              <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white">Toda la arena, un solo HUD</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-neutral-400">
              Desafíos, salas, ranking, wallet y perfil: la misma competencia, ahora con lectura de combate.
            </p>
          </div>

          <StaggerIn className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {landingFeatures.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </StaggerIn>
        </div>
      </section>

      <section className="bg-[#05060a] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatusBadge tone="orange">Cómo se juega</StatusBadge>
          <h2 className="mt-4 font-heading text-3xl font-bold text-white">Tres pasos a la arena</h2>
          <StaggerIn className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { step: "01", title: "Vinculá tu UID", copy: "Tu identidad de Free Fire entra al perfil y queda lista para competir." },
              { step: "02", title: "Cargá Coins", copy: "Recargás, un admin confirma, y ya podés inscribirte o crear salas." },
              { step: "03", title: "Competí y cobrá", copy: "Desafíos y 1v1 a 4v4. El ranking de esta plataforma se arma acá." },
            ].map((item) => (
              <article key={item.step} className="arena-panel p-6">
                <p className="font-heading text-3xl font-bold text-orange-300">{item.step}</p>
                <h3 className="mt-3 font-heading text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{item.copy}</p>
              </article>
            ))}
          </StaggerIn>
        </div>

        <StaggerIn className="mx-auto mt-12 grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <StatCard icon={Gamepad2} label="Partidas" value="128" meta="Esta semana" tone="orange" />
          <StatCard icon={Crown} label="Victorias" value="42" meta="Top 3%" tone="emerald" />
          <StatCard icon={Coins} label="Coins" value="760" meta="Balance actual" tone="yellow" />
          <StatCard icon={ShieldCheck} label="UID" value="OK" meta="Perfil verificado" tone="cyan" />
        </StaggerIn>
      </section>
    </GamingShell>
  );
}
