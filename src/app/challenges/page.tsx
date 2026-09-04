"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChallengeListCard } from "@/components/presentation/ChallengeListCard";
import { EmptyPanel, ErrorPanel, LoadingPanel } from "@/components/presentation/FeedbackPanel";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { getActiveChallenges, getCompletedChallenges, type Challenge } from "@/lib/challenges";
import { subscribeRealtime } from "@/lib/realtime";

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
        const [challenges, completed] = await Promise.all([
          getActiveChallenges(),
          getCompletedChallenges().catch(() => [] as Challenge[]),
        ]);
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
        title="Torneos Battle Royale"
        description="Inscribite con Coins, jugá partidas normales de Free Fire y sincronizá la métrica del evento. Cuenta lo que sumes desde que te anotaste. Premios fijos para 1°, 2° y 3°."
      />

      {state.status === "loading" && <LoadingPanel label="Cargando desafíos..." />}

      {state.status === "error" && (
        <ErrorPanel title="No pudimos cargar los desafíos" message={state.message} />
      )}

      {state.status === "ready" && (
        <>
          <StaggerIn className="flex flex-col gap-4">
            {state.challenges.length === 0 ? (
              <EmptyPanel
                icon={<Trophy className="size-10" />}
                title="No hay desafíos activos"
                message="Cuando se creen competencias nuevas, aparecerán aquí en tiempo real."
              />
            ) : (
              state.challenges.map((challenge) => <ChallengeListCard key={challenge.id} challenge={challenge} />)
            )}
          </StaggerIn>
          {state.completed.length > 0 && (
            <section className="space-y-4">
              <h2 className="font-heading text-lg font-bold text-white">Cerrados</h2>
              <div className="flex flex-col gap-4">
                {state.completed.map((challenge) => (
                  <ChallengeListCard key={challenge.id} challenge={challenge} ctaLabel="Ver resultado" />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
