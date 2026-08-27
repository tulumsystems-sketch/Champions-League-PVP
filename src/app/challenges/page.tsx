"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Coins, Loader2, Trophy } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { HoverLift } from "@/components/motion/HoverLift";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { challengePrizeLabel, getActiveChallenges, getCompletedChallenges, type Challenge } from "@/lib/challenges";
import { metricLabel } from "@/lib/player-stats";
import { subscribeRealtime } from "@/lib/realtime";
import type { AuthenticatedProfile } from "@/lib/profile";

type ChallengesState =
  | { status: "loading" }
  | { status: "ready"; challenges: Challenge[]; completed: Challenge[] }
  | { status: "error"; message: string };

export default function ChallengesPage() {
  return (
    <AuthenticatedLayout>
      {(auth) => (
        <AppLayout auth={auth}>
          <ChallengesContent />
        </AppLayout>
      )}
    </AuthenticatedLayout>
  );
}

function ChallengesContent() {
  const [state, setState] = useState<ChallengesState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    const loadChallenges = async (silent = false) => {
      if (!silent) setState({ status: "loading" });

      try {
        const [challenges, completed] = await Promise.all([getActiveChallenges(), getCompletedChallenges()]);
        if (!active) return;
        setState({ status: "ready", challenges, completed });
      } catch (error) {
        if (!active) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "No pudimos cargar los desafíos.",
        });
      }
    };

    loadChallenges();
    const unsubscribe = subscribeRealtime("challenges-board", ["challenges", "challenge_participants"], () => {
      void loadChallenges(true);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <div className="arena-page">
      <PageHeader
        badge="Desafíos"
        live
        title="Competencias y torneos PVP"
        description="Inscríbete con Coins, competí por premios fijos (1° / 2° / 3°) y sumá según la métrica del desafío. Lo que cuenta es lo que juegues desde que te inscribís."
      />

        {state.status === "loading" && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/80 p-5 text-neutral-300">
            <Loader2 className="size-5 animate-spin text-orange-200" />
            <span className="text-sm font-semibold">Cargando desafíos...</span>
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-5 text-red-100">
            <p className="font-bold">No pudimos cargar los desafíos</p>
            <p className="mt-1 text-sm text-red-100/75">{state.message}</p>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <StaggerIn className="grid gap-6 sm:grid-cols-2">
              {state.challenges.length === 0 ? (
                <div className="arena-panel p-8 text-center sm:col-span-2">
                  <Trophy className="mx-auto size-10 text-orange-400" />
                  <h2 className="mt-4 font-heading text-xl font-bold text-white">No hay desafíos activos</h2>
                  <p className="mt-2 text-sm text-neutral-400">Cuando se creen competencias nuevas, aparecerán aquí en tiempo real.</p>
                </div>
              ) : (
                state.challenges.map((challenge) => <ChallengeListCard key={challenge.id} challenge={challenge} />)
              )}
            </StaggerIn>
            {state.completed.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-black text-white">Cerrados</h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {state.completed.map((challenge) => <ChallengeListCard key={challenge.id} challenge={challenge} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
  );
}

function ChallengeListCard({ challenge }: { challenge: Challenge }) {
  return (
    <HoverLift>
    <article className="arena-panel flex h-full flex-col justify-between p-6 transition-all hover:border-orange-500/40">
      <div>
        <div className="flex items-center justify-between gap-2">
          <StatusBadge tone={challenge.status === "completed" ? "cyan" : challenge.status === "cancelled" ? "red" : "orange"}>{challenge.status || "active"}</StatusBadge>
          <span className="text-xs font-black text-orange-400">{challenge.entry_fee} Coins de entrada</span>
        </div>
        <h2 className="mt-4 text-2xl font-black text-white">{challenge.title}</h2>
        <p className="mt-2 text-sm text-neutral-400 leading-relaxed">{challenge.description || "Desafío competitivo de Free Fire."}</p>
        <p className="mt-3 text-xs font-bold text-orange-200">{challengePrizeLabel(challenge)}</p>
        <p className="mt-1 text-xs text-neutral-500">Métrica: {metricLabel(challenge.metric)}</p>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-neutral-400 font-semibold">{challenge.max_players ? `${challenge.max_players} cupos máx.` : "Cupos abiertos"}</span>
        <Link
          href={`/challenges/${challenge.id}`}
          className="arena-btn"
        >
          Ver Desafío
        </Link>
      </div>
    </article>
    </HoverLift>
  );
}

function InfoPill({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string }) {
  return (
    <div className="arena-stat">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-500">
        <Icon className="size-4 text-cyan-200" />
        {label}
      </div>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "Fechas a confirmar";
  if (startDate && !endDate) return `Desde ${formatDate(startDate)}`;
  if (!startDate && endDate) return `Hasta ${formatDate(endDate)}`;
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function formatDate(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
