import { fetchAndSyncPlayerFreeFireStats } from "@/app/actions/free-fire";
import { assertPlayableFreeFireAccount } from "@/lib/free-fire/guard";
import { getFreeFireAvatarUrl } from "@/lib/free-fire/providers/community-api-provider";
import { isProfileComplete, PROFILE_SELECT } from "@/lib/profile";
import { metricCareerTotal, metricLabel, persistFreeFireSnapshot } from "@/lib/player-stats";
import { supabase } from "@/lib/supabase";

export type Challenge = {
  id: string;
  title: string;
  description: string | null;
  metric: string | null;
  entry_fee: number;
  prizeFirst: number;
  prizeSecond: number;
  prizeThird: number;
  start_date: string | null;
  end_date: string | null;
  max_players: number | null;
  status: string | null;
  created_at: string | null;
  closedAt: string | null;
};

export const CHALLENGE_METRICS = [
  { value: "points", label: "Puntos" },
  { value: "wins", label: "Victorias" },
  { value: "kills", label: "Kills" },
  { value: "headshots", label: "Headshots" },
  { value: "damage", label: "Daño" },
] as const;

export const DEFAULT_CHALLENGE_PRIZES = { first: 50, second: 30, third: 10 };

export type ChallengeParticipant = {
  id: string;
  challenge_id: string;
  user_id: string;
  score: number;
  position: number | null;
  joined_at: string | null;
  baselineScore: number | null;
  lastSyncedAt: string | null;
};

export type ChallengeStanding = {
  participantId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  score: number;
  position: number | null;
  joinedAt: string | null;
  lastSyncedAt: string | null;
  prizeCoins: number;
};

const CHALLENGE_SELECT =
  "id, title, description, metric, entry_fee, prize_first, prize_second, prize_third, start_date, end_date, max_players, status, created_at, closed_at";

type WalletRecord = {
  id: string;
  user_id: string;
  balance: number;
};

export async function getActiveChallenges() {
  const { data, error } = await supabase
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .in("status", ["active", "upcoming"])
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeChallenge);
}

export async function getChallengeById(id: string) {
  const { data, error } = await supabase
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeChallenge(data) : null;
}

export async function getAdminChallenges() {
  const { data, error } = await supabase
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeChallenge);
}

export async function getCompletedChallenges() {
  const { data, error } = await supabase
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .in("status", ["completed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeChallenge);
}

export function previewChallengePrizes(
  playerCount: number,
  prizes: { first: number; second: number; third: number } = DEFAULT_CHALLENGE_PRIZES,
) {
  if (playerCount < 2) {
    return { pot: 0, cancelled: true as const, shares: [] as number[] };
  }

  const shares = [prizes.first, prizes.second, prizes.third];
  const paidSlots = Math.min(3, playerCount);
  const paid = shares.slice(0, paidSlots);
  return { pot: paid.reduce((total, value) => total + value, 0), cancelled: false as const, shares: paid };
}

export function challengePrizeLabel(challenge: Pick<Challenge, "prizeFirst" | "prizeSecond" | "prizeThird">) {
  return `1° ${challenge.prizeFirst} · 2° ${challenge.prizeSecond} · 3° ${challenge.prizeThird} Coins`;
}

export function challengeStatusLabel(status: string | null | undefined) {
  if (status === "upcoming" || status === "scheduled") return "Próximo";
  if (status === "completed") return "Cerrado";
  if (status === "cancelled") return "Cancelado";
  return "En curso";
}

export function challengeStatusTone(status: string | null | undefined): "orange" | "cyan" | "emerald" | "red" {
  if (status === "upcoming" || status === "scheduled") return "orange";
  if (status === "completed") return "cyan";
  if (status === "cancelled") return "red";
  return "emerald";
}

export function isChallengeUpcoming(status: string | null | undefined) {
  return status === "upcoming" || status === "scheduled";
}

export function isChallengeJoinable(status: string | null | undefined) {
  return status === "active";
}

export function challengeBannerSrc(metric: string | null | undefined) {
  if (metric === "kills") return "/banners/challenge-kills.png";
  if (metric === "wins") return "/banners/challenge-wins.png";
  if (metric === "headshots") return "/banners/challenge-headshots.png";
  if (metric === "damage") return "/banners/challenge-damage.png";
  if (metric === "points" || metric === "ranking_points") return "/banners/challenge-points.png";
  return "/banners/challenge-br.png";
}

function rpcError(message: string) {
  return message.replace("ERROR: ", "").replace(/^P0001:\s*/, "");
}

export async function createChallenge(input: {
  title: string;
  description: string;
  metric: string;
  entryFee: number;
  startDate: string;
  endDate: string;
  maxPlayers: number | null;
  status: "active" | "upcoming";
  prizeFirst: number;
  prizeSecond: number;
  prizeThird: number;
}) {
  const { error } = await supabase.rpc("create_challenge", {
    p_title: input.title,
    p_description: input.description,
    p_metric: input.metric,
    p_entry_fee: input.entryFee,
    p_start_date: input.startDate,
    p_end_date: input.endDate,
    p_max_players: input.maxPlayers,
    p_status: input.status,
    p_prize_first: input.prizeFirst,
    p_prize_second: input.prizeSecond,
    p_prize_third: input.prizeThird,
  });
  if (error) throw new Error(rpcError(error.message));
}

export async function updateChallenge(id: string, input: {
  title: string;
  description: string;
  metric: string;
  entryFee: number;
  startDate: string;
  endDate: string;
  maxPlayers: number | null;
  status: "active" | "upcoming";
  prizeFirst: number;
  prizeSecond: number;
  prizeThird: number;
}) {
  const { error } = await supabase.rpc("update_challenge", {
    p_challenge_id: id,
    p_title: input.title,
    p_description: input.description,
    p_metric: input.metric,
    p_entry_fee: input.entryFee,
    p_start_date: input.startDate,
    p_end_date: input.endDate,
    p_max_players: input.maxPlayers,
    p_status: input.status,
    p_prize_first: input.prizeFirst,
    p_prize_second: input.prizeSecond,
    p_prize_third: input.prizeThird,
  });
  if (error) throw new Error(rpcError(error.message));
}

export async function closeChallenge(id: string) {
  const { data, error } = await supabase.rpc("close_challenge", { p_challenge_id: id });
  if (error) throw new Error(rpcError(error.message));
  return data as { status: string; pot?: number; refunded?: number; reason?: string };
}

export async function cancelChallenge(id: string) {
  const { data, error } = await supabase.rpc("cancel_challenge", { p_challenge_id: id });
  if (error) throw new Error(rpcError(error.message));
  return data as { status: string; refunded?: number };
}

export async function getChallengeEnrollmentCounts() {
  const { data, error } = await supabase.from("challenge_participants").select("challenge_id");

  if (error) {
    throw new Error(error.message);
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const id = String(row.challenge_id);
    counts[id] = (counts[id] || 0) + 1;
  }
  return counts;
}

export async function getChallengeStandings(challengeId: string): Promise<ChallengeStanding[]> {
  const { data, error } = await supabase.rpc("get_challenge_standings", { p_challenge_id: challengeId });

  if (error) {
    throw new Error(error.message.replace("ERROR: ", "").replace(/^P0001:\s*/, ""));
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    participantId: String(row.participant_id),
    userId: String(row.user_id),
    nickname: String(row.nickname || "Jugador"),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    score: Number(row.score || 0),
    position: row.standing === null || row.standing === undefined ? null : Number(row.standing),
    joinedAt: row.joined_at ? String(row.joined_at) : null,
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
    prizeCoins: Number(row.prize_coins || 0),
  }));
}

export async function syncMyChallengeScore(input: {
  participantId: string;
  userId: string;
  uid: string;
  region: string;
  metric: string | null;
}) {
  const result = await fetchAndSyncPlayerFreeFireStats(input.uid, input.region);

  if (!result.ok) {
    throw new Error(result.message);
  }

  await persistFreeFireSnapshot({
    userId: input.userId,
    uid: input.uid,
    region: input.region,
    info: result.info,
    stats: result.stats,
    avatarUrl: getFreeFireAvatarUrl(result.info.avatarId),
  });

  const careerTotal = Math.max(0, Math.floor(metricCareerTotal(result.info, result.stats, input.metric)));
  const { data, error } = await supabase.rpc("apply_own_challenge_career_total", {
    p_participant_id: input.participantId,
    p_career_total: careerTotal,
  });

  if (error) {
    throw new Error(error.message.replace("ERROR: ", "").replace(/^P0001:\s*/, ""));
  }

  return {
    score: Number(data ?? 0),
    careerTotal,
    metricLabel: metricLabel(input.metric),
  };
}

export async function getChallengeParticipation(challengeId: string, userId: string) {
  const { data, error } = await supabase
    .from("challenge_participants")
    .select("id, challenge_id, user_id, score, position, joined_at, baseline_score, last_synced_at")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeParticipant(data) : null;
}

export async function joinChallenge(challengeId: string, userId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || user.id !== userId) {
    throw new Error("Necesitás iniciar sesión para inscribirte.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!isProfileComplete(profile)) {
    throw new Error("Completá tu UID de Free Fire antes de inscribirte.");
  }

  await assertPlayableFreeFireAccount(profile?.freefire_uid);

  const challenge = await getChallengeById(challengeId);

  if (!challenge || !isChallengeJoinable(challenge.status)) {
    throw new Error("Este desafío no está disponible para inscripción.");
  }

  const existingParticipant = await getChallengeParticipation(challengeId, userId);

  if (existingParticipant) {
    throw new Error("Ya estás inscripto en este desafío.");
  }

  const { error: joinError } = await supabase.rpc("join_challenge", {
    p_challenge_id: challenge.id,
  });

  if (joinError) {
    throw new Error(joinError.message.replace("ERROR: ", "").replace(/^P0001:\s*/, ""));
  }

  const participant = await getChallengeParticipation(challenge.id, userId);
  const wallet = await getWalletForUser(userId);

  if (!participant) {
    throw new Error("La inscripción se procesó pero no se pudo leer el participante.");
  }

  let baselineWarning: string | null = null;
  try {
    await syncMyChallengeScore({
      participantId: participant.id,
      userId,
      uid: profile!.freefire_uid!,
      region: profile?.freefire_region || "br",
      metric: challenge.metric,
    });
  } catch (syncError) {
    baselineWarning =
      syncError instanceof Error
        ? syncError.message
        : "Inscripción ok, pero no se pudo fijar el punto de partida. Sincronizá stats.";
  }

  const refreshed = await getChallengeParticipation(challenge.id, userId);

  return {
    challenge,
    participant: refreshed || participant,
    balance: wallet?.balance ?? 0,
    baselineWarning,
  };
}

async function getWalletForUser(userId: string) {
  const { data, error } = await supabase
    .from("wallets")
    .select("id, user_id, balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeWalletRecord(data) : null;
}

function normalizeChallenge(challenge: unknown): Challenge {
  const value = challenge as Record<string, unknown>;

  return {
    id: String(value.id),
    title: String(value.title || "Desafío"),
    description: (value.description as string | null) || null,
    metric: (value.metric as string | null) || null,
    entry_fee: Number(value.entry_fee || 0),
    prizeFirst: Number(value.prize_first ?? DEFAULT_CHALLENGE_PRIZES.first),
    prizeSecond: Number(value.prize_second ?? DEFAULT_CHALLENGE_PRIZES.second),
    prizeThird: Number(value.prize_third ?? DEFAULT_CHALLENGE_PRIZES.third),
    start_date: value.start_date ? String(value.start_date) : null,
    end_date: value.end_date ? String(value.end_date) : null,
    max_players: value.max_players === null || value.max_players === undefined ? null : Number(value.max_players),
    status: (value.status as string | null) || null,
    created_at: value.created_at ? String(value.created_at) : null,
    closedAt: value.closed_at ? String(value.closed_at) : null,
  };
}

function normalizeParticipant(participant: unknown): ChallengeParticipant {
  const value = participant as Record<string, unknown>;

  return {
    id: String(value.id),
    challenge_id: String(value.challenge_id),
    user_id: String(value.user_id),
    score: Number(value.score || 0),
    position: value.position === null || value.position === undefined ? null : Number(value.position),
    joined_at: value.joined_at ? String(value.joined_at) : null,
    baselineScore: value.baseline_score === null || value.baseline_score === undefined ? null : Number(value.baseline_score),
    lastSyncedAt: value.last_synced_at ? String(value.last_synced_at) : null,
  };
}

function normalizeWalletRecord(wallet: unknown): WalletRecord {
  const value = wallet as Partial<WalletRecord>;

  return {
    id: String(value.id),
    user_id: String(value.user_id),
    balance: Number(value.balance || 0),
  };
}
