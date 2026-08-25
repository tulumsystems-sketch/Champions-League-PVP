"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Coins, Loader2, RefreshCw, ShieldCheck, Trophy, UsersRound } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import type { AuthenticatedProfile } from "@/lib/profile";
import {
  challengePrizeLabel,
  getChallengeById,
  getChallengeParticipation,
  getChallengeStandings,
  joinChallenge,
  previewChallengePrizes,
  syncMyChallengeScore,
  type Challenge,
  type ChallengeParticipant,
  type ChallengeStanding,
} from "@/lib/challenges";
import { metricLabel } from "@/lib/player-stats";
import { subscribeRealtime } from "@/lib/realtime";

type ChallengeDetailState =
  | { status: "loading" }
  | { status: "ready"; challenge: Challenge; participant: ChallengeParticipant | null; standings: ChallengeStanding[] }
  | { status: "not-found" }
  | { status: "error"; message: string };

export default function ChallengeDetailPage() {
  return (
    <AuthenticatedLayout>
      {(auth) => (
        <AppLayout auth={auth}>
          <ChallengeDetailContent auth={auth} />
        </AppLayout>
      )}
    </AuthenticatedLayout>
  );
}

function ChallengeDetailContent({ auth }: { auth: AuthenticatedProfile }) {
  const params = useParams<{ id: string }>();
  const challengeId = params.id;
  const [state, setState] = useState<ChallengeDetailState>({ status: "loading" });
  const [joining, setJoining] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadChallenge = async () => {
    const challenge = await getChallengeById(challengeId);
    if (!challenge) return { notFound: true as const };
    const [participant, standings] = await Promise.all([
      getChallengeParticipation(challenge.id, auth.user.id),
      getChallengeStandings(challenge.id),
    ]);
    return { notFound: false as const, challenge, participant, standings };
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      setState({ status: "loading" });
      setSuccess(null);
      setError(null);

      try {
        const result = await loadChallenge();
        if (!active) return;
        if (result.notFound) {
          setState({ status: "not-found" });
          return;
        }
        setState({
          status: "ready",
          challenge: result.challenge,
          participant: result.participant,
          standings: result.standings,
        });
      } catch (loadError) {
        if (!active) return;
        setState({
          status: "error",
          message: loadError instanceof Error ? loadError.message : "No pudimos cargar el desafío.",
        });
      }
    };

    run();
    const unsubscribe = subscribeRealtime(`challenge:${challengeId}`, ["challenges", "challenge_participants"], () => {
      if (!active) return;
      void loadChallenge()
        .then((result) => {
          if (!active || result.notFound) return;
          setState({
            status: "ready",
            challenge: result.challenge,
            participant: result.participant,
            standings: result.standings,
          });
        })
        .catch(() => {});
    });

    return () => {
      active = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user.id, challengeId]);

  const handleJoin = async () => {
    if (joining || state.status !== "ready" || state.participant) return;

    setJoining(true);
    setSuccess(null);
    setError(null);

    try {
      const result = await joinChallenge(state.challenge.id, auth.user.id);
      const standings = await getChallengeStandings(state.challenge.id);
      setState({ status: "ready", challenge: result.challenge, participant: result.participant, standings });
      if (result.baselineWarning) {
        setError(result.baselineWarning);
        setSuccess("Inscripción confirmada. Sincronizá stats para fijar tu punto de partida.");
      } else {
        setSuccess("Inscripción confirmada. Marcamos tu punto de partida: el ranking cuenta lo que juegues desde ahora.");
      }
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "No pudimos completar la inscripción.");
    } finally {
      setJoining(false);
    }
  };

  const handleSyncStats = async () => {
    if (syncing || state.status !== "ready" || !state.participant) return;

    setSyncing(true);
    setSuccess(null);
    setError(null);

    try {
      const uid = auth.profile?.freefire_uid;
      if (!uid) {
        throw new Error("Necesitás vincular tu UID de Free Fire en Perfil para sincronizar estadísticas.");
      }

      const result = await syncMyChallengeScore({
        participantId: state.participant.id,
        userId: auth.user.id,
        uid,
        region: auth.profile?.freefire_region || "br",
        metric: state.challenge.metric,
      });

      const [participant, standings] = await Promise.all([
        getChallengeParticipation(state.challenge.id, auth.user.id),
        getChallengeStandings(state.challenge.id),
      ]);
      setState({ status: "ready", challenge: state.challenge, participant, standings });

      if (result.score === 0) {
        setSuccess(`Punto de partida fijado en ${result.metricLabel}. El ranking cuenta lo que sumes desde ahora.`);
      } else {
        setSuccess(`Stats sincronizadas. Tu puntaje del desafío (${result.metricLabel}): ${result.score}.`);
      }
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Error al sincronizar estadísticas.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {state.status === "loading" && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-neutral-900/80 p-6 text-neutral-300 shadow-xl">
          <Loader2 className="size-5 animate-spin text-orange-400" />
          <span className="text-sm font-bold">Cargando desafío de arena...</span>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100 shadow-xl">
          <p className="font-bold text-base">Error al cargar el desafío</p>
          <p className="mt-1 text-sm text-red-100/75">{state.message}</p>
        </div>
      )}

      {state.status === "not-found" && (
        <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-8 text-center shadow-xl">
          <Trophy className="mx-auto size-10 text-orange-400" />
          <h1 className="mt-4 text-2xl font-black text-white">Desafío no encontrado</h1>
          <p className="mt-2 text-sm text-neutral-400">Puede que haya finalizado o no esté disponible.</p>
        </div>
      )}

      {state.status === "ready" && (
        <div className="space-y-6">
          <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="rounded-3xl border border-white/10 bg-neutral-900/90 p-6 shadow-2xl backdrop-blur-xl md:p-8">
              <StatusBadge tone={state.challenge.status === "active" ? "emerald" : state.challenge.status === "completed" ? "cyan" : state.challenge.status === "cancelled" ? "red" : "orange"}>
                {state.challenge.status || "active"}
              </StatusBadge>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">{state.challenge.title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                {state.challenge.description || "Desafío competitivo oficial de Free Fire."}
              </p>
              <p className="mt-4 text-xs text-neutral-500">
                El puntaje es lo que sumaste en {metricLabel(state.challenge.metric)} desde que te inscribiste
                {state.challenge.metric === "points" || state.challenge.metric === "ranking_points"
                  ? ", según tus puntos de ranking de Free Fire."
                  : ", consultado a la API de Free Fire."}{" "}
                No cuenta el historial anterior.
              </p>

              {success && (
                <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
                  {success}
                </div>
              )}
              {error && (
                <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                  {error}
                </div>
              )}
            </div>

            <aside className="flex flex-col justify-between rounded-3xl border border-orange-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900 to-orange-950/40 p-6 shadow-2xl backdrop-blur-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Costo de Entrada</span>
                  <Coins className="size-6 text-orange-400" />
                </div>
                <p className="mt-3 text-4xl font-black text-white">
                  {state.challenge.entry_fee} <span className="text-sm font-bold text-orange-300">Coins</span>
                </p>
                <p className="mt-2 text-xs text-neutral-400">
                  Métrica: <strong className="text-white">{metricLabel(state.challenge.metric)}</strong>
                </p>
                <p className="mt-2 text-xs font-bold text-orange-200">{challengePrizeLabel(state.challenge)}</p>
                {state.participant && (
                  <p className="mt-3 text-sm font-bold text-cyan-200">Tu puntaje: {state.participant.score}</p>
                )}
                {(state.challenge.status === "completed" || state.challenge.status === "cancelled") && (
                  <p className="mt-3 text-xs text-neutral-400">
                    {state.challenge.status === "completed" ? "Cerrado y premios acreditados." : "Cancelado. Las entradas se reembolsaron."}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joining || Boolean(state.participant) || state.challenge.status !== "active"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-950/50 transition hover:from-orange-500 hover:to-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joining ? <Loader2 className="size-5 animate-spin" /> : <ShieldCheck className="size-5" />}
                  {state.participant ? "Inscripto" : joining ? "Inscribiendo..." : state.challenge.status === "active" ? "Confirmar inscripción" : "Inscripción cerrada"}
                </button>

                {state.participant && (
                  <button
                    type="button"
                    onClick={handleSyncStats}
                    disabled={syncing || state.challenge.status === "completed" || state.challenge.status === "cancelled"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 text-xs font-black text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-60"
                  >
                    {syncing ? <Loader2 className="size-4 animate-spin text-cyan-400" /> : <RefreshCw className="size-4 text-cyan-400" />}
                    {syncing ? "Consultando API..." : "Sincronizar stats Free Fire"}
                  </button>
                )}
              </div>
            </aside>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <InfoCard icon={CalendarDays} label="Fecha de inicio" value={formatDate(state.challenge.start_date)} />
            <InfoCard icon={CalendarDays} label="Fecha de cierre" value={formatDate(state.challenge.end_date)} />
            <InfoCard
              icon={UsersRound}
              label="Inscriptos"
              value={`${state.standings.length}${state.challenge.max_players ? ` / ${state.challenge.max_players}` : ""}`}
            />
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/85">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Tabla en vivo</p>
                <h2 className="mt-1 text-lg font-black text-white">Posiciones · {metricLabel(state.challenge.metric)}</h2>
              </div>
              <StatusBadge tone="cyan">API Free Fire</StatusBadge>
            </div>
            {state.standings.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-500">Todavía no hay inscriptos.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.14em] text-neutral-500">
                    <tr>
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3">Jugador</th>
                      <th className="px-5 py-3">Puntaje</th>
                      <th className="px-5 py-3">Premio</th>
                      <th className="px-5 py-3">Última sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {(() => {
                      const preview = previewChallengePrizes(state.standings.length, {
                        first: state.challenge.prizeFirst,
                        second: state.challenge.prizeSecond,
                        third: state.challenge.prizeThird,
                      });
                      return state.standings.map((row, index) => {
                        const isMe = row.userId === auth.user.id;
                        const prize =
                          state.challenge.status === "completed"
                            ? row.prizeCoins
                            : preview.shares[(row.position ?? index + 1) - 1] ?? 0;
                        return (
                          <tr key={row.participantId} className={isMe ? "bg-orange-500/10" : undefined}>
                            <td className="px-5 py-4 font-black text-white">{row.position ?? "—"}</td>
                            <td className="px-5 py-4 font-bold text-white">
                              {row.nickname}
                              {isMe ? <span className="ml-2 text-xs text-orange-300">vos</span> : null}
                            </td>
                            <td className="px-5 py-4 font-black text-orange-200">{row.score}</td>
                            <td className="px-5 py-4 font-bold text-emerald-200">{prize > 0 ? `${prize} Coins` : "—"}</td>
                            <td className="px-5 py-4 text-neutral-400">{row.lastSyncedAt ? formatDate(row.lastSyncedAt) : "Pendiente"}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/80 p-4 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-500">
        <Icon className="size-4 text-cyan-200" />
        {label}
      </div>
      <p className="mt-2 font-bold text-white">{value}</p>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "A confirmar";

  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
