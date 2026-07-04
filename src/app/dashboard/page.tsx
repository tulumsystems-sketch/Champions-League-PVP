"use client";

import {
  Activity,
  AlertCircle,
  Crosshair,
  Mail,
  ShieldCheck,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { ChallengeCard } from "@/components/presentation/ChallengeCard";
import { FeatureCard } from "@/components/presentation/FeatureCard";
import { PlayerProfileCard } from "@/components/presentation/PlayerProfileCard";
import { RankingTable } from "@/components/presentation/RankingTable";
import { StatCard } from "@/components/presentation/StatCard";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { GamingShell } from "@/components/GamingShell";
import { accessCards, activityItems, challengeCards, rankingRows } from "@/lib/presentation-data";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getProfileEmail, getProfileName, getProfileStatus, getProfileUid } from "@/lib/profile";

const accessIcons = [Crosshair, UsersRound, Trophy, WalletCards, UserRound];

const roomCards = [
  { mode: "1 vs 1", entry: "10 Coins", status: "3 salas abiertas", tone: "orange" as const },
  { mode: "2 vs 2", entry: "15 Coins", status: "2 salas abiertas", tone: "cyan" as const },
  { mode: "4 vs 4", entry: "50 Coins", status: "1 sala premium", tone: "emerald" as const },
];

export default function DashboardPage() {
  return (
    <AuthenticatedLayout requireCompleteProfile={false}>
      {(auth) => <DashboardContent auth={auth} />}
    </AuthenticatedLayout>
  );
}

function DashboardContent({ auth }: { auth: AuthenticatedProfile }) {
  const displayName = getProfileName(auth.profile, auth.user);
  const email = getProfileEmail(auth.profile, auth.user);
  const freefireUid = getProfileUid(auth.profile);
  const status = getProfileStatus(auth.profile);
  const hasFreefireUid = Boolean(auth.profile?.freefire_uid);

  return (
    <GamingShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-white/10 bg-neutral-900/80 p-6 shadow-2xl shadow-black/25">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <StatusBadge tone="orange">Arena del jugador</StatusBadge>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">
                  Bienvenido, {displayName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
                  Tu perfil competitivo se alimenta desde Supabase y queda listo para desafíos, salas privadas y ranking.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-4 text-left md:text-right">
                <div className="flex items-center gap-2 text-emerald-100 md:justify-end">
                  <ShieldCheck className="size-5" />
                  <span className="text-sm font-bold uppercase tracking-[0.16em]">Estado</span>
                </div>
                <p className="mt-2 text-3xl font-black text-white">{status}</p>
                <p className="text-sm text-emerald-100/70">Perfil Supabase</p>
              </div>
            </div>
          </div>
          <PlayerProfileCard auth={auth} />
        </section>

        {!hasFreefireUid && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-4 text-cyan-100">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-bold">Completá tu UID de Free Fire para activar tu perfil competitivo</p>
              <p className="mt-1 text-sm text-cyan-100/75">
                Podés completarlo desde la pantalla de completar perfil o editarlo en tu perfil.
              </p>
            </div>
          </div>
        )}

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={UserRound} label="Nickname" value={displayName} meta="Dato real de profiles" tone="orange" />
          <StatCard icon={Mail} label="Email" value={email} meta="Dato real de Auth/profiles" tone="cyan" />
          <StatCard icon={Crosshair} label="UID Free Fire" value={freefireUid} meta={hasFreefireUid ? "Vinculado" : "Pendiente"} tone="red" />
          <StatCard icon={ShieldCheck} label="Status" value={status} meta="Estado de cuenta" tone="emerald" />
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <StatusBadge tone="cyan">Accesos</StatusBadge>
              <h2 className="mt-3 text-2xl font-black text-white">Módulos principales</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {accessCards.map((card, index) => (
              <FeatureCard key={card.title} icon={accessIcons[index]} {...card} />
            ))}
          </div>
        </section>

        <section id="desafios" className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <StatusBadge tone="orange">Próximos desafíos</StatusBadge>
              <h2 className="mt-3 text-2xl font-black text-white">Competencias abiertas</h2>
            </div>
            <p className="hidden max-w-md text-right text-sm text-neutral-500 md:block">
              Cupos, premios y entradas visibles para que cada jugador entienda la competencia al instante.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {challengeCards.map((challenge) => (
              <ChallengeCard key={challenge.title} {...challenge} />
            ))}
          </div>
        </section>

        <section id="salas" className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <StatusBadge tone="emerald">Salas privadas</StatusBadge>
            <span className="text-sm text-neutral-500">Emparejamiento activo</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {roomCards.map((room) => (
              <article key={room.mode} className="rounded-lg border border-white/10 bg-neutral-900/80 p-5 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Modalidad</p>
                    <h3 className="mt-1 text-2xl font-black text-white">{room.mode}</h3>
                  </div>
                  <StatusBadge tone={room.tone}>{room.status}</StatusBadge>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-sm text-neutral-400">Entrada</span>
                  <span className="font-bold text-orange-200">{room.entry}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_380px]">
          <div id="ranking">
            <RankingTable rows={rankingRows} />
          </div>

          <aside id="wallet" className="rounded-lg border border-white/10 bg-neutral-900/80 p-5 shadow-2xl shadow-black/25">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Actividad reciente</p>
                <h3 className="mt-1 text-lg font-bold text-white">Wallet y perfil</h3>
              </div>
              <Activity className="size-5 text-cyan-200" />
            </div>
            <div className="mt-4 space-y-3">
              {activityItems.map((item) => (
                <div key={item.title} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-neutral-500">{item.meta}</p>
                    </div>
                    <span
                      className={
                        item.tone === "credit"
                          ? "text-sm font-bold text-emerald-300"
                          : item.tone === "debit"
                            ? "text-sm font-bold text-red-300"
                            : "text-sm font-bold text-cyan-300"
                      }
                    >
                      {item.amount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </GamingShell>
  );
}
