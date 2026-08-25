"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Coins,
  Flame,
  Trophy,
  Loader2,
} from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { RankingTable } from "@/components/presentation/RankingTable";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getProfileName, getProfileUid } from "@/lib/profile";
import { getOrCreateWallet, getWalletTransactions, type Wallet, type WalletTransaction } from "@/lib/wallet";
import { fetchAndSyncPlayerFreeFireStats } from "@/app/actions/free-fire";
import { getFreeFireAvatarUrl, type CommunityPlayerInfo } from "@/lib/free-fire/providers/community-api-provider";
import { challengePrizeLabel, getActiveChallenges, type Challenge } from "@/lib/challenges";
import { getPlatformRank, type PlatformRank } from "@/lib/arena-stats";
import { getStoredCareerStats, isFreeFireSnapshotStale, persistFreeFireSnapshot, metricLabel, type CareerStats } from "@/lib/player-stats";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/rooms-db";
import { cn } from "@/lib/utils";

type DashboardState =
  | { status: "loading" }
  | {
      status: "ready";
      wallet: Wallet;
      transactions: WalletTransaction[];
      ffStats: CommunityPlayerInfo | null;
      career: CareerStats | null;
      challenges: Challenge[];
      leaderboard: LeaderboardEntry[];
      platform: PlatformRank;
    }
  | { status: "error"; message: string };

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      {(auth) => (
        <AppLayout auth={auth}>
          <DashboardContent auth={auth} />
        </AppLayout>
      )}
    </AuthenticatedLayout>
  );
}

function DashboardContent({ auth }: { auth: AuthenticatedProfile }) {
  const [state, setState] = useState<DashboardState>({ status: "loading" });
  const freefireUid = getProfileUid(auth.profile);
  const hasFreefireUid = Boolean(auth.profile?.freefire_uid);

  const displayName = 
    (state.status === "ready" && state.ffStats?.nickname) 
      ? state.ffStats.nickname 
      : (auth.profile?.nickname || getProfileName(auth.profile, auth.user));

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setState({ status: "loading" });

      try {
        const wallet = await getOrCreateWallet(auth.user.id);
        const transactions = await getWalletTransactions(wallet.id);
        const challenges = await getActiveChallenges();
        const emptyPlatform: PlatformRank = {
          rank: null,
          wins: 0,
          participations: 0,
          coinsWon: 0,
          points: 0,
          nickname: getProfileName(auth.profile, auth.user),
        };
        const [leaderboard, platform] = await Promise.all([
          getLeaderboard(5).catch(() => [] as LeaderboardEntry[]),
          getPlatformRank(auth.user.id).catch(() => emptyPlatform),
        ]);

        let ffStats: CommunityPlayerInfo | null = null;
        let career: CareerStats | null = null;
        try {
          career = await getStoredCareerStats(auth.user.id);
        } catch {
          career = null;
        }

        if (auth.profile?.freefire_uid) {
          if (isFreeFireSnapshotStale(career?.updatedAt)) {
            const res = await fetchAndSyncPlayerFreeFireStats(
              auth.profile.freefire_uid,
              auth.profile.freefire_region || "br",
            );
            if (res.ok) {
              ffStats = res.info;
              const persist = await persistFreeFireSnapshot({
                userId: auth.user.id,
                uid: auth.profile.freefire_uid,
                region: auth.profile.freefire_region || "br",
                info: res.info,
                stats: res.stats,
                avatarUrl: getFreeFireAvatarUrl(res.info.avatarId),
              });
              if (persist.ok) career = persist.career;
            }
          } else {
            ffStats = {
              accountId: auth.profile.freefire_uid,
              nickname: auth.profile.nickname,
              region: auth.profile.freefire_region,
              level: auth.profile.freefire_level,
              rank: auth.profile.freefire_rank,
              rankingPoints: career?.rankingPoints ?? null,
              csRank: null,
              liked: auth.profile.freefire_likes,
              lastLoginAt: null,
              createdAt: null,
              clanName: auth.profile.clan_name,
              clanLevel: null,
              signature: auth.profile.signature,
              avatarId: null,
              petLevel: null,
              fields: [],
            };
          }
        }

        if (!active) return;
        setState({ status: "ready", wallet, transactions, ffStats, career, challenges, leaderboard, platform });
      } catch (error) {
        if (!active) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Error al cargar el dashboard.",
        });
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [auth]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Welcome Command Center Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-orange-950/40 p-6 md:p-8 shadow-2xl shadow-black/40">
        <div className="absolute -right-12 -top-12 size-64 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 bottom-0 size-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge tone="orange">Arena Command Center</StatusBadge>
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                Servidores en Línea
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">{displayName}</span>!
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-neutral-300">
              Ranking y Coins de esta arena, más tu identidad de Free Fire. Inscribite en desafíos, entrá a salas y seguí tu puesto.
            </p>
          </div>

          {/* Quick Wallet / Stats Widget */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            <div className="rounded-2xl border border-orange-500/30 bg-black/40 p-4 backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Balance Coins</span>
                <Coins className="size-5 text-orange-400" />
              </div>
              <p className="mt-3 text-3xl font-black text-white">
                {state.status === "ready" ? `${state.wallet.balance}` : "..."} <span className="text-xs font-semibold text-orange-300">Coins</span>
              </p>
              <Link href="/wallet" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300">
                Gestionar wallet <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <DashboardStat
          label="Puesto arena"
          value={state.status === "ready" && state.platform.rank ? `#${state.platform.rank}` : state.status === "ready" ? "—" : "..."}
        />
        <DashboardStat
          label="Victorias"
          value={state.status === "ready" ? state.platform.wins.toLocaleString("es-AR") : "..."}
        />
        <DashboardStat
          label="Participaciones"
          value={state.status === "ready" ? state.platform.participations.toLocaleString("es-AR") : "..."}
        />
        <DashboardStat
          label="Coins ganadas"
          value={state.status === "ready" ? state.platform.coinsWon.toLocaleString("es-AR") : "..."}
        />
        <DashboardStat
          label="Puntos"
          value={state.status === "ready" ? state.platform.points.toLocaleString("es-AR") : "..."}
        />
      </section>

      {hasFreefireUid ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStat
            label="Nivel FF"
            value={String(state.status === "ready" ? (state.ffStats?.level ?? auth.profile?.freefire_level ?? "—") : "...")}
          />
          <DashboardStat
            label="Rango BR"
            value={String(state.status === "ready" ? (state.ffStats?.rank ?? auth.profile?.freefire_rank ?? "—") : "...")}
          />
          <DashboardStat
            label="Clan"
            value={state.status === "ready" ? state.ffStats?.clanName || auth.profile?.clan_name || "Sin clan" : "..."}
          />
          <DashboardStat label="UID" value={freefireUid} />
        </section>
      ) : (
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/10 p-5 text-cyan-100">
          <p className="font-bold">Vinculá tu UID de Free Fire</p>
          <p className="mt-1 text-sm text-cyan-100/75">
            Sirve para tu identidad y para inscribirte. El ranking de la arena se arma con salas y desafíos. Completá el UID en{" "}
            <Link href="/profile" className="font-black underline">
              Perfil
            </Link>
            .
          </p>
        </div>
      )}
      {hasFreefireUid && state.status === "ready" && state.career ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStat label="Victorias FF" value={state.career.wins.toLocaleString("es-AR")} />
          <DashboardStat label="Kills FF" value={state.career.kills.toLocaleString("es-AR")} />
          <DashboardStat label="Headshots FF" value={state.career.headshots.toLocaleString("es-AR")} />
          <DashboardStat label="Daño FF" value={state.career.damage.toLocaleString("es-AR")} />
        </section>
      ) : null}

      {/* Main Content Focus: Torneos y Retos (Central & Full Width) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-black tracking-wide uppercase text-orange-400">
                <Flame className="size-3.5 text-orange-400 animate-pulse" />
                Arena Oficial de Batalla
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Torneos y Retos</h2>
            <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
              Inscríbete en las copas activas y futuras de Free Fire. Demuestra tu nivel en la arena, compite en enfrentamientos directos y asegura tu lugar en la gloria competitiva.
            </p>
          </div>
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-black text-white shadow-xl shadow-orange-950/60 hover:bg-orange-500 transition-all shrink-0"
          >
            <Trophy className="size-4" />
            Ver Todos los Torneos
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {state.status === "loading" ? (
            <div className="col-span-full flex items-center justify-center p-16 text-neutral-400 gap-3">
              <Loader2 className="size-6 animate-spin text-orange-400" /> Sincronizando torneos con Supabase...
            </div>
          ) : state.status === "ready" && state.challenges.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-white/10 bg-neutral-900/90 p-10 text-center text-neutral-400 space-y-3">
              <p className="font-bold text-white text-lg">No hay torneos activos en este momento.</p>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Pronto habilitaremos nuevas ligas competitivas y enfrentamientos en la arena. Mantente atento a las actualizaciones.
              </p>
            </div>
          ) : (
            state.status === "ready" &&
            state.challenges.map((challenge) => {
              const isUpcoming = challenge.status === "upcoming" || challenge.status === "scheduled";
              return (
                <article
                  key={challenge.id}
                  className="rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-900 via-neutral-900/95 to-neutral-950 p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden group hover:border-orange-500/50 hover:shadow-orange-950/20 transition-all"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/15 transition-all" />

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[11px] font-black uppercase tracking-wider",
                          isUpcoming ? "bg-amber-500/10 text-amber-300 border border-amber-500/30" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30",
                        )}
                      >
                        {isUpcoming ? "Próximamente" : "En Curso"}
                      </span>
                      <span className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-300">
                        {challenge.entry_fee} Coins
                      </span>
                    </div>

                    <h3 className="mt-4 text-xl font-black text-white group-hover:text-orange-300 transition-colors">
                      {challenge.title}
                    </h3>

                    <p className="mt-2 text-xs text-neutral-400 leading-relaxed line-clamp-2">
                      {challenge.description || "Torneo competitivo oficial de Free Fire con emparejamientos directos y premios en saldo de Coins."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold tracking-wider text-neutral-500 block">Métrica</span>
                      <span className="text-xs font-black text-neutral-200">{metricLabel(challenge.metric)}</span>
                      <p className="mt-1 text-[10px] font-bold text-orange-200">{challengePrizeLabel(challenge)}</p>
                    </div>
                    <Link
                      href={`/challenges/${challenge.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-950/40 hover:from-orange-500 hover:to-orange-400 transition-all"
                    >
                      {isUpcoming ? "Ver Detalles" : "Inscribirme"}
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section id="ranking" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <StatusBadge tone="cyan">Ranking</StatusBadge>
            <h2 className="mt-3 text-2xl font-black text-white">Top de la arena</h2>
            <p className="mt-1 text-sm text-neutral-500">Puntos de salas y desafíos, no de la carrera de Free Fire.</p>
          </div>
          <Link href="/ranking" className="text-sm font-bold text-orange-300 hover:text-orange-200">
            Ver ranking completo
          </Link>
        </div>
        {state.status === "ready" && (
          <RankingTable rows={state.leaderboard} title="Top 5" highlightUserId={auth.user.id} />
        )}
      </section>
    </div>
  );
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">{label}</p>
      <p className="mt-2 truncate text-xl font-black text-white">{value}</p>
    </div>
  );
}
