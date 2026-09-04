"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Save, ShieldCheck } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { PlayerUltimateCard } from "@/components/presentation/PlayerUltimateCard";
import { CombatStat } from "@/components/motion/CombatStat";
import type { CommunityPlayerInfo } from "@/lib/free-fire/providers/community-api-provider";
import { getFreeFireAvatarUrl } from "@/lib/free-fire/providers/community-api-provider";
import { normalizeFreeFireRegion } from "@/lib/free-fire/regions";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getInitials, getProfileEmail, getProfileName, getProfileStatus } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { FreeFireUidLookup } from "@/components/profile/FreeFireUidLookup";
import { getStoredCareerStats, isFreeFireSnapshotStale, persistFreeFireSnapshot, type CareerStats } from "@/lib/player-stats";
import { fetchAndSyncPlayerFreeFireStats } from "@/app/actions/free-fire";
import {
  challengePlaceLabel,
  formatHistoryDate,
  getMyChallengeHistory,
  getMyMatchHistory,
  getPlatformRank,
  matchResultLabel,
  roomStatusLabel,
  walletMoveLabel,
  type ChallengeHistoryItem,
  type MatchHistoryItem,
  type PlatformRank,
} from "@/lib/arena-stats";
import { getOrCreateWallet, getWalletTransactions, type Wallet, type WalletTransaction } from "@/lib/wallet";

const inputClass =
  "arena-input";

export default function ProfilePage() {
  return (
    <AuthenticatedLayout requireCompleteProfile={false}>
      {(auth) => (
        <AppLayout auth={auth}>
          <ProfileContent auth={auth} />
        </AppLayout>
      )}
    </AuthenticatedLayout>
  );
}

function ProfileContent({ auth }: { auth: AuthenticatedProfile }) {
  const [nickname, setNickname] = useState(getProfileName(auth.profile, auth.user));
  const [freefireUid, setFreefireUid] = useState(auth.profile?.freefire_uid || "");
  const [freefireRegion, setFreefireRegion] = useState(auth.profile?.freefire_region || "br");
  const [avatarUrl, setAvatarUrl] = useState(auth.profile?.avatar_url || "");
  const [verifiedPlayer, setVerifiedPlayer] = useState<CommunityPlayerInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [career, setCareer] = useState<CareerStats | null>(null);
  const [arena, setArena] = useState<{
    wallet: Wallet | null;
    rank: PlatformRank | null;
    matches: MatchHistoryItem[];
    challenges: ChallengeHistoryItem[];
    movements: WalletTransaction[];
  }>({ wallet: null, rank: null, matches: [], challenges: [], movements: [] });

  const email = getProfileEmail(auth.profile, auth.user);
  const status = getProfileStatus(auth.profile);
  const initials = getInitials(nickname) || "P";
  const visibleFreefireUid = freefireUid.trim() || "Pendiente";
  const displayAvatarUrl = getFreeFireAvatarUrl(verifiedPlayer?.avatarId) || avatarUrl;
  const displayName = verifiedPlayer?.nickname || nickname || "Jugador Free Fire";
  const cardLevel = verifiedPlayer?.level ?? auth.profile?.freefire_level ?? 0;
  const cardRank = verifiedPlayer?.rank ?? auth.profile?.freefire_rank ?? null;
  const cardPoints = verifiedPlayer?.rankingPoints ?? career?.rankingPoints ?? 0;

  useEffect(() => {
    let active = true;

    const loadArena = async () => {
      try {
        const wallet = await getOrCreateWallet(auth.user.id);
        const [rank, matches, challenges, movements, storedCareer] = await Promise.all([
          getPlatformRank(auth.user.id),
          getMyMatchHistory(auth.user.id),
          getMyChallengeHistory(auth.user.id),
          getWalletTransactions(wallet.id, 8),
          getStoredCareerStats(auth.user.id).catch(() => null),
        ]);
        if (!active) return;
        setArena({ wallet, rank, matches, challenges, movements });
        setCareer(storedCareer);
      } catch {
        if (!active) return;
      }
    };

    loadArena();
    return () => {
      active = false;
    };
  }, [auth.user.id]);

  useEffect(() => {
    if (!auth.profile?.freefire_uid) return;
    let active = true;

    const fetchLive = async () => {
      const region = auth.profile?.freefire_region || "br";
      const stored = await getStoredCareerStats(auth.user.id).catch(() => null);
      if (!isFreeFireSnapshotStale(stored?.updatedAt)) {
        if (stored) setCareer(stored);
        return;
      }

      const res = await fetchAndSyncPlayerFreeFireStats(auth.profile!.freefire_uid!, region);
      if (!active) return;
      if (res.ok) {
        setVerifiedPlayer(res.info);
        await persistFreeFireSnapshot({
          userId: auth.user.id,
          uid: auth.profile!.freefire_uid!,
          region,
          info: res.info,
          stats: res.stats,
          avatarUrl: getFreeFireAvatarUrl(res.info.avatarId),
        });
        const avatar = getFreeFireAvatarUrl(res.info.avatarId);
        if (avatar) setAvatarUrl(avatar);
        const nextCareer = await getStoredCareerStats(auth.user.id).catch(() => null);
        if (active && nextCareer) setCareer(nextCareer);
      }
    };

    fetchLive();

    return () => {
      active = false;
    };
  }, [auth.profile, auth.user.id]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    const resolvedNickname = verifiedPlayer?.nickname?.trim() || nickname.trim();
    const resolvedAvatar = getFreeFireAvatarUrl(verifiedPlayer?.avatarId) || avatarUrl.trim() || null;

    const updatePayload: Record<string, unknown> = {
      nickname: resolvedNickname,
      freefire_uid: freefireUid.trim() || null,
      avatar_url: resolvedAvatar,
      freefire_region: normalizeFreeFireRegion(freefireRegion),
      freefire_level: verifiedPlayer?.level ?? auth.profile?.freefire_level ?? 0,
      freefire_likes: verifiedPlayer?.liked ?? auth.profile?.freefire_likes ?? 0,
      freefire_rank: verifiedPlayer?.rank ?? auth.profile?.freefire_rank ?? 0,
      clan_name: verifiedPlayer?.clanName ?? auth.profile?.clan_name ?? null,
      signature: verifiedPlayer?.signature ?? auth.profile?.signature ?? null,
    };

    const update = await supabase.from("profiles").update(updatePayload).eq("id", auth.user.id);
    const updateError = update.error;

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    if (resolvedNickname !== nickname) {
      setNickname(resolvedNickname);
    }
    if (resolvedAvatar && resolvedAvatar !== avatarUrl) {
      setAvatarUrl(resolvedAvatar);
    }

    setSuccess("¡UID vinculado y datos sincronizados con éxito desde la API de Free Fire!");
    setSaving(false);
  };

  return (
    <div className="arena-page">
      <PageHeader
        badge="Gestión de cuenta"
        title="Perfil oficial de jugador"
        description="Coins, puesto y historial de esta arena. El UID de Free Fire queda como identidad para jugar, no como ranking."
      />

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        {/* Left Gamer Card */}
        <aside className="space-y-6">
          <PlayerUltimateCard
            player={{
              name: displayName,
              avatarUrl: displayAvatarUrl,
              initials,
              uid: visibleFreefireUid,
              region: freefireRegion,
              clan: verifiedPlayer?.clanName || auth.profile?.clan_name,
              level: cardLevel,
              rank: cardRank,
              rankingPoints: cardPoints,
              likes: verifiedPlayer?.liked ?? auth.profile?.freefire_likes ?? 0,
              kills: career?.kills ?? 0,
              wins: career?.wins ?? 0,
              headshots: career?.headshots ?? 0,
              position: "FF",
            }}
          />
          <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-white/40">
            Carta de jugador · temporada CLP
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <StatusBadge tone={status === "active" ? "emerald" : "red"}>
              {status === "active" ? "Activo" : "Suspendido"}
            </StatusBadge>
            <p className="text-xs text-neutral-500">{email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CombatStat label="Coins" value={arena.wallet ? Number(arena.wallet.balance) : 0} tone="coin" />
            <CombatStat label="Puesto" value={arena.rank?.rank ? `#${arena.rank.rank}` : "—"} />
            <CombatStat label="Victorias arena" value={arena.rank?.wins ?? 0} tone="win" />
            <CombatStat label="Puntos arena" value={arena.rank?.points ?? 0} tone="kill" />
          </div>

          {verifiedPlayer?.signature ? (
            <p className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-center text-xs italic text-neutral-400">
              “{verifiedPlayer.signature}”
            </p>
          ) : null}
        </aside>

        {/* Right Form & Verification */}
        <div className="space-y-6">
          <section className="arena-panel p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-black text-white">Vincular UID de Free Fire</h3>
                <p className="text-xs text-neutral-400">El nickname, avatar y estadísticas se obtienen automáticamente de la API.</p>
              </div>
              <ShieldCheck className="size-6 text-arena" />
            </div>

            <form onSubmit={handleSave} className="mt-6 space-y-5">
              {success && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
                  {success}
                </div>
              )}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">Nickname (Sincronizado de la API)</label>
                <input
                  type="text"
                  value={verifiedPlayer?.nickname || nickname}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-neutral-950/60 px-4 py-3 text-neutral-400 cursor-not-allowed font-bold"
                />
              </div>

              <FreeFireUidLookup
                uid={freefireUid}
                region={freefireRegion}
                userId={auth.user.id}
                onUidChange={setFreefireUid}
                onRegionChange={setFreefireRegion}
                onPlayerLoaded={(info) => setVerifiedPlayer(info)}
                inputClassName={inputClass}
              />

              <div className="rounded-2xl border border-arena/25 bg-white/5 p-4 text-xs text-white/75 space-y-1">
                <p className="font-bold">Nota de seguridad:</p>
                <p className="text-neutral-400">El avatar y la identidad del jugador están bloqueados a los registros oficiales de Free Fire y no pueden modificarse manualmente.</p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="arena-btn w-full py-3.5 disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                {saving ? "Guardando en Supabase..." : "Vincular y Guardar UID"}
              </button>
            </form>
          </section>
        </div>
      </div>

      <section className="space-y-6">
        <div>
          <StatusBadge tone="cyan">Historial</StatusBadge>
          <h2 className="mt-3 text-2xl font-black text-white">Desafíos y movimientos</h2>
          <p className="mt-1 text-sm text-neutral-500">Resultado y premio de lo que jugaste en esta plataforma. Las salas 1v1 a 4v4 están en construcción.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <HistoryCard
            title="Salas"
            empty="Las salas 1v1 a 4v4 están en construcción. El juego del MVP es por desafíos."
            action={{ href: "/challenges", label: "Ir a desafíos" }}
          >
            {arena.matches.map((match) => (
              <div key={match.id} className="rounded-xl border border-white/10 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-white">{match.mode} · {match.entryFee} Coins</p>
                  <StatusBadge tone={match.result === "win" ? "emerald" : match.result === "loss" ? "red" : match.result === "cancelled" ? "neutral" : "orange"}>
                    {matchResultLabel(match.result)}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {roomStatusLabel(match.status)} · {formatHistoryDate(match.createdAt)}
                </p>
                <p className="mt-1 text-xs font-bold text-arena">
                  Premio: {match.prize.toLocaleString("es-AR")} Coins
                </p>
              </div>
            ))}
          </HistoryCard>

          <HistoryCard
            title="Desafíos"
            empty="Todavía no te inscribiste en desafíos."
            action={{ href: "/challenges", label: "Ir a desafíos" }}
          >
            {arena.challenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/challenges/${challenge.challengeId}`}
                className="block rounded-xl border border-white/10 px-3 py-3 transition hover:border-arena/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-white truncate">{challenge.title}</p>
                  <StatusBadge tone={challenge.status === "completed" && challenge.position === 1 ? "emerald" : challenge.status === "cancelled" ? "neutral" : "cyan"}>
                    {challengePlaceLabel(challenge.position, challenge.status)}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {challenge.metric} · {formatHistoryDate(challenge.createdAt)}
                </p>
                <p className="mt-1 text-xs font-bold text-arena">
                  Premio: {challenge.prize.toLocaleString("es-AR")} Coins
                </p>
              </Link>
            ))}
          </HistoryCard>

          <HistoryCard
            title="Wallet"
            empty="Sin movimientos todavía."
            action={{ href: "/wallet", label: "Ver wallet" }}
          >
            {arena.movements.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-3">
                <div>
                  <p className="font-bold text-white text-sm">{walletMoveLabel(tx)}</p>
                  <p className="text-xs text-neutral-500">{formatHistoryDate(tx.created_at)}</p>
                </div>
                <p className={tx.type === "credit" ? "text-sm font-black text-emerald-300" : "text-sm font-black text-red-300"}>
                  {tx.type === "credit" ? "+" : "-"}
                  {Number(tx.amount).toLocaleString("es-AR")}
                </p>
              </div>
            ))}
          </HistoryCard>
        </div>
      </section>
    </div>
  );
}

function HistoryCard({
  title,
  empty,
  action,
  children,
}: {
  title: string;
  empty: string;
  action: { href: string; label: string };
  children: ReactNode;
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <section className="arena-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-white">{title}</h3>
        <Link href={action.href} className="text-xs font-bold text-arena hover:text-white">
          {action.label}
        </Link>
      </div>
      {isEmpty ? (
        <p className="mt-3 text-sm text-neutral-500">{empty}</p>
      ) : (
        <div className="mt-3 space-y-2">{children}</div>
      )}
    </section>
  );
}
