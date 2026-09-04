"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { RankingTable } from "@/components/presentation/RankingTable";
import { ErrorPanel, LoadingPanel } from "@/components/presentation/FeedbackPanel";
import { CombatStat } from "@/components/motion/CombatStat";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { getPlatformRank, type PlatformRank } from "@/lib/arena-stats";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/rooms-db";
import { subscribeRealtime } from "@/lib/realtime";

type RankingState =
  | { status: "loading" }
  | { status: "ready"; rows: LeaderboardEntry[]; me: PlatformRank }
  | { status: "error"; message: string };

export default function RankingPage() {
  return (
    <AuthenticatedLayout>
      {(auth) => (
        <AppLayout auth={auth}>
          <RankingContent userId={auth.user.id} />
        </AppLayout>
      )}
    </AuthenticatedLayout>
  );
}

function RankingContent({ userId }: { userId: string }) {
  const [state, setState] = useState<RankingState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    const loadRanking = async () => {
      try {
        const [rows, me] = await Promise.all([getLeaderboard(50), getPlatformRank(userId)]);
        if (!active) return;
        setState({ status: "ready", rows, me });
      } catch (error) {
        if (!active) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "No pudimos cargar el ranking.",
        });
      }
    };

    loadRanking();
    const unsubscribe = subscribeRealtime("ranking-board", ["leaderboard"], () => {
      void loadRanking();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);

  const inTop =
    state.status === "ready" && state.rows.some((row) => row.userId === userId);

  return (
    <div className="arena-page">
      <PageHeader
        badge="Ranking"
        badgeTone="cyan"
        live
        title="Clasificación de la arena"
        description="Victorias, participaciones, Coins ganadas y puntos de desafíos y torneos de esta plataforma. La carrera de Free Fire no entra en esta tabla."
      />

      {state.status === "ready" ? (
        <StaggerIn className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <CombatStat label="Tu puesto" value={state.me.rank ? `#${state.me.rank}` : "—"} />
          <CombatStat label="Victorias" value={state.me.wins} tone="win" />
          <CombatStat label="Participaciones" value={state.me.participations} />
          <CombatStat label="Coins ganadas" value={state.me.coinsWon} tone="coin" />
          <CombatStat label="Puntos" value={state.me.points} tone="kill" />
        </StaggerIn>
      ) : null}

      {state.status === "loading" && <LoadingPanel label="Cargando ranking..." />}

      {state.status === "error" && (
        <ErrorPanel title="No pudimos cargar el ranking" message={state.message} />
      )}

      {state.status === "ready" && (
        <RankingTable
          rows={state.rows}
          title="Top 50"
          highlightUserId={userId}
          emptyMessage="Todavía no hay jugadores rankeados. Cerrá un desafío para aparecer acá."
        />
      )}

      {state.status === "ready" && state.rows.length === 0 && (
        <div className="flex items-start gap-3 arena-panel p-5 text-neutral-300">
          <Trophy className="mt-0.5 size-5 text-arena" />
          <p className="text-sm leading-6">
            El ranking se llena cuando se cierran desafíos y torneos. Sincronizar el UID de Free Fire no suma puntos acá.
          </p>
        </div>
      )}

      {state.status === "ready" && state.me.rank && !inTop ? (
        <div className="rounded-3xl border border-arena/20 bg-arena/10 p-5 text-arena">
          <p className="font-bold">Estás fuera del top 50</p>
          <p className="mt-1 text-sm text-white/75">
            Puesto #{state.me.rank} · {state.me.points.toLocaleString("es-AR")} puntos · {state.me.wins} victorias
          </p>
        </div>
      ) : null}
    </div>
  );
}
