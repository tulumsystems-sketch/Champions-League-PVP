"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Coins,
  Flame,
  Trophy,
} from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { LivePulse } from "@/components/hud/LivePulse";
import { RankingTable } from "@/components/presentation/RankingTable";
import { ChallengeListCard } from "@/components/presentation/ChallengeListCard";
import { EmptyPanel, LoadingPanel } from "@/components/presentation/FeedbackPanel";
import { PlayerUltimateCard } from "@/components/presentation/PlayerUltimateCard";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { CombatStat } from "@/components/motion/CombatStat";
import { StaggerIn } from "@/components/motion/StaggerIn";
import { CoinChip } from "@/components/motion/CoinChip";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getInitials, getProfileName, getProfileUid } from "@/lib/profile";
import { getOrCreateWallet, getWalletTransactions, type Wallet, type WalletTransaction } from "@/lib/wallet";
import { fetchAndSyncPlayerFreeFireStats } from "@/app/actions/free-fire";
import { getFreeFireAvatarUrl, type CommunityPlayerInfo } from "@/lib/free-fire/providers/community-api-provider";
import { getActiveChallenges, isChallengeUpcoming, type Challenge } from "@/lib/challenges";
import { getPlatformRank, type PlatformRank } from "@/lib/arena-stats";
import { getStoredCareerStats, isFreeFireSnapshotStale, persistFreeFireSnapshot, type CareerStats } from "@/lib/player-stats";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/rooms-db";

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
  }, [auth.user.id, auth.profile?.freefire_uid, auth.profile?.freefire_region]);

  return (
    <div className="arena-page">
      <section className="arena-panel relative p-6 md:p-8">
        <div className="absolute -right-12 -top-12 size-64 rounded-full bg-arena/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 bottom-0 size-48 rounded-full bg-arena/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <PlayerUltimateCard
              size="sm"
              player={{
                name: displayName,
                avatarUrl: auth.profile?.avatar_url,
                initials: getInitials(displayName) || "P",
                uid: getProfileUid(auth.profile),
                region: auth.profile?.freefire_region,
                clan: auth.profile?.clan_name,
                level: state.status === "ready" ? Number(state.ffStats?.level ?? auth.profile?.freefire_level ?? 0) : auth.profile?.freefire_level,
                rank: state.status === "ready" ? Number(state.ffStats?.rank ?? auth.profile?.freefire_rank ?? 0) : auth.profile?.freefire_rank,
                rankingPoints: state.status === "ready" ? Number(state.ffStats?.rankingPoints ?? state.career?.rankingPoints ?? 0) : 0,
                likes: state.status === "ready" ? Number(state.ffStats?.liked ?? auth.profile?.freefire_likes ?? 0) : auth.profile?.freefire_likes,
                kills: state.status === "ready" ? state.career?.kills ?? 0 : 0,
                wins: state.status === "ready" ? state.career?.wins ?? 0 : 0,
                headshots: state.status === "ready" ? state.career?.headshots ?? 0 : 0,
                position: "FF",
              }}
            />
            <div className="space-y-3 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="orange">Inicio</StatusBadge>
                <LivePulse />
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-white md:text-5xl">
                ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-arena to-amber-200">{displayName}</span>!
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-neutral-300">
                Ranking y Coins de esta arena, más tu identidad de Free Fire. Inscribite en desafíos y seguí tu puesto.
              </p>
            </div>
          </div>

          <div className="arena-stat min-w-[200px]">
            <div className="flex items-center justify-between gap-4">
              <span className="arena-kicker">Balance</span>
              <Coins className="size-5 text-amber-400" />
            </div>
            <div className="mt-3">
              <CoinChip balance={state.status === "ready" ? Number(state.wallet.balance) : null} className="px-0 py-0 border-0 bg-transparent" />
            </div>
            <Link href="/wallet" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-arena hover:text-white">
              Gestionar wallet <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <StaggerIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <CombatStat
          label="Puesto arena"
          value={state.status === "ready" && state.platform.rank ? `#${state.platform.rank}` : state.status === "ready" ? "—" : "..."}
        />
        <CombatStat
          label="Victorias"
          value={state.status === "ready" ? state.platform.wins : 0}
          tone="win"
        />
        <CombatStat
          label="Participaciones"
          value={state.status === "ready" ? state.platform.participations : 0}
        />
        <CombatStat
          label="Coins ganadas"
          value={state.status === "ready" ? state.platform.coinsWon : 0}
          tone="coin"
        />
        <CombatStat
          label="Puntos"
          value={state.status === "ready" ? state.platform.points : 0}
          tone="kill"
        />
      </StaggerIn>

      {hasFreefireUid ? (
        <StaggerIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CombatStat
            label="Nivel FF"
            value={state.status === "ready" ? Number(state.ffStats?.level ?? auth.profile?.freefire_level ?? 0) : 0}
          />
          <CombatStat
            label="Rango BR"
            value={state.status === "ready" ? Number(state.ffStats?.rank ?? auth.profile?.freefire_rank ?? 0) : 0}
          />
          <CombatStat
            label="Clan"
            value={state.status === "ready" ? state.ffStats?.clanName || auth.profile?.clan_name || "Sin clan" : "..."}
          />
          <CombatStat label="UID" value={freefireUid} />
        </StaggerIn>
      ) : (
        <div className="arena-panel border-arena/20 p-5 text-white/80">
          <p className="font-bold">Vinculá tu UID de Free Fire</p>
          <p className="mt-1 text-sm text-white/70">
            Sirve para tu identidad y para inscribirte. El ranking de la arena se arma con desafíos y torneos. Completá el UID en{" "}
            <Link href="/profile" className="font-black underline">
              Perfil
            </Link>
            .
          </p>
        </div>
      )}
      {hasFreefireUid && state.status === "ready" && state.career ? (
        <StaggerIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CombatStat label="Victorias FF" value={state.career.wins} tone="win" />
          <CombatStat label="Kills FF" value={state.career.kills} tone="kill" />
          <CombatStat label="Headshots FF" value={state.career.headshots} tone="headshot" />
          <CombatStat label="Daño FF" value={state.career.damage} tone="kill" />
        </StaggerIn>
      ) : null}

      {/* Main Content Focus: Torneos y Retos (Central & Full Width) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-arena/30 bg-arena/10 px-3.5 py-1 text-xs font-black tracking-wide uppercase text-arena">
                <Flame className="size-3.5 text-arena animate-pulse" />
                Arena Oficial de Batalla
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Torneos y Retos</h2>
            <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
              Inscribite en los torneos Battle Royale. Jugá partidas de Free Fire, sincronizá la métrica y peleá el 1°, 2° y 3°.
            </p>
          </div>
          <Link
            href="/challenges"
            className="arena-btn shrink-0"
          >
            <Trophy className="size-4" />
            Ver Todos los Torneos
          </Link>
        </div>

        <StaggerIn className="flex flex-col gap-4">
          {state.status === "loading" ? (
            <LoadingPanel label="Cargando torneos..." />
          ) : state.status === "ready" && state.challenges.length === 0 ? (
            <EmptyPanel
              title="No hay torneos activos"
              message="Cuando un admin publique un desafío Battle Royale, aparece acá para inscribirte."
            />
          ) : (
            state.status === "ready" &&
            state.challenges.map((challenge) => (
              <ChallengeListCard
                key={challenge.id}
                challenge={challenge}
                ctaLabel={isChallengeUpcoming(challenge.status) ? "Ver detalles" : "Inscribirme"}
              />
            ))
          )}
        </StaggerIn>
      </section>

      <section id="ranking" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <StatusBadge tone="cyan">Ranking</StatusBadge>
            <h2 className="mt-3 text-2xl font-black text-white">Top de la arena</h2>
            <p className="mt-1 text-sm text-neutral-500">Puntos de desafíos y torneos, no de la carrera de Free Fire.</p>
          </div>
          <Link href="/ranking" className="text-sm font-bold text-arena hover:text-arena">
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
