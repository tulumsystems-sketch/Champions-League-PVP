import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Crosshair,
  Crown,
  Gamepad2,
  ShieldCheck,
  Swords,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { FeatureCard } from "@/components/presentation/FeatureCard";
import { StatCard } from "@/components/presentation/StatCard";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { GamingShell } from "@/components/GamingShell";

const landingFeatures = [
  {
    title: "Desafíos PvP",
    description: "Competencias temporales con reglas claras, cupos limitados y premios visibles.",
    href: "/dashboard#desafios",
    accent: "orange" as const,
    icon: Crosshair,
  },
  {
    title: "Salas privadas",
    description: "Modos 1 vs 1, 2 vs 2 y squads con entrada en Coins y validación de resultado.",
    href: "/dashboard#salas",
    accent: "cyan" as const,
    icon: UsersRound,
  },
  {
    title: "Ranking competitivo",
    description: "Leaderboard semanal para destacar victorias, puntos y rendimiento real.",
    href: "/dashboard#ranking",
    accent: "emerald" as const,
    icon: Trophy,
  },
  {
    title: "Wallet de Coins",
    description: "Balance, movimientos, premios y base visual para futuros retiros.",
    href: "/dashboard#wallet",
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
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(10,10,10,0.98) 0%, rgba(10,10,10,0.82) 40%, rgba(10,10,10,0.46) 74%, rgba(10,10,10,0.78) 100%), url('/arena-hero.png')",
          }}
        />
        <div className="relative mx-auto flex min-h-[92svh] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 font-black text-white">
              <span className="flex size-10 items-center justify-center rounded-lg bg-orange-600 shadow-lg shadow-orange-950/40">
                <Swords className="size-5" />
              </span>
              <span className="text-sm uppercase tracking-[0.24em] sm:text-base">Champions League PVP</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:inline-flex"
              >
                Ingresar
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-black text-neutral-950 transition hover:bg-orange-100"
              >
                Crear cuenta
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </nav>

          <div className="flex flex-1 items-center py-12">
            <div className="max-w-3xl">
              <StatusBadge tone="orange">Arena competitiva</StatusBadge>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Champions League PVP
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-200 sm:text-xl">
                Plataforma competitiva para jugadores de Free Fire: torneos, salas privadas, rankings, Coins y premios en una experiencia lista para vender.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-orange-950/40 transition hover:bg-orange-500"
                >
                  Entrar a la plataforma
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
                >
                  Crear cuenta
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-3 pb-6 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/35 p-4 backdrop-blur">
              <p className="text-2xl font-black text-white">+300</p>
              <p className="text-sm text-neutral-400">jugadores proyectados</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/35 p-4 backdrop-blur">
              <p className="text-2xl font-black text-yellow-100">Coins</p>
              <p className="text-sm text-neutral-400">economía interna</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/35 p-4 backdrop-blur">
              <p className="text-2xl font-black text-cyan-100">PvP</p>
              <p className="text-sm text-neutral-400">desafíos y salas privadas</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-neutral-950/80 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <StatusBadge tone="cyan">Producto visual</StatusBadge>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Todo lo que el cliente necesita ver hoy</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-neutral-400">
              La plataforma muestra la experiencia comercial completa: competición, progreso, Coins y perfiles de jugador.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {landingFeatures.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 py-14">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          <StatCard icon={Gamepad2} label="Partidas" value="128" meta="Esta semana" tone="orange" />
          <StatCard icon={Crown} label="Victorias" value="42" meta="Top 3%" tone="emerald" />
          <StatCard icon={Coins} label="Coins" value="760" meta="Balance actual" tone="yellow" />
          <StatCard icon={ShieldCheck} label="UID" value="OK" meta="Perfil verificado" tone="cyan" />
        </div>
      </section>
    </GamingShell>
  );
}
