import { supabase } from "@/lib/supabase";
import { metricLabel } from "@/lib/player-stats";
import {
  roomStatusLabel,
  type RoomMode,
  type RoomStatus,
  type RoomTeam,
} from "@/lib/rooms-db";
import type { WalletTransaction } from "@/lib/wallet";

export type PlatformRank = {
  rank: number | null;
  wins: number;
  participations: number;
  coinsWon: number;
  points: number;
  nickname: string;
};

export type MatchHistoryItem = {
  id: string;
  roomId: string;
  mode: RoomMode | string;
  entryFee: number;
  status: RoomStatus;
  team: RoomTeam;
  winnerTeam: RoomTeam | null;
  result: "win" | "loss" | "pending" | "cancelled";
  prize: number;
  createdAt: string;
};

export type ChallengeHistoryItem = {
  id: string;
  challengeId: string;
  title: string;
  metric: string;
  status: string;
  position: number | null;
  score: number;
  prize: number;
  createdAt: string;
};

type RankRpc = {
  rank?: number | null;
  wins?: number;
  participations?: number;
  coinsWon?: number;
  points?: number;
  nickname?: string;
};

export function formatHistoryDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function matchResultLabel(result: MatchHistoryItem["result"]) {
  if (result === "win") return "Victoria";
  if (result === "loss") return "Derrota";
  if (result === "cancelled") return "Cancelada";
  return "En curso";
}

export function challengePlaceLabel(position: number | null, status: string) {
  if (status === "cancelled") return "Cancelado";
  if (status !== "completed" || !position) return "En curso";
  if (position === 1) return "1º puesto";
  if (position === 2) return "2º puesto";
  if (position === 3) return "3º puesto";
  return `${position}º puesto`;
}

export async function getPlatformRank(userId: string): Promise<PlatformRank> {
  const { data, error } = await supabase.rpc("get_platform_rank", { p_user_id: userId });
  if (error) throw new Error(error.message);

  const row = (data || {}) as RankRpc;
  return {
    rank: typeof row.rank === "number" ? row.rank : null,
    wins: Number(row.wins || 0),
    participations: Number(row.participations || 0),
    coinsWon: Number(row.coinsWon || 0),
    points: Number(row.points || 0),
    nickname: String(row.nickname || "Jugador"),
  };
}

export async function getMyMatchHistory(userId: string, limit = 20): Promise<MatchHistoryItem[]> {
  const { data, error } = await supabase
    .from("match_room_players")
    .select(
      "id, team, joined_at, room:match_rooms!inner(id, mode, status, prize, winner_team, created_at, entry_fee, players:match_room_players(user_id, team))",
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data || []).map((row) => {
    const room = asRecord(row.room);
    const status = String(room.status || "waiting") as RoomStatus;
    const team = (row.team === "b" ? "b" : "a") as RoomTeam;
    const winnerTeam = room.winner_team === "a" || room.winner_team === "b" ? room.winner_team : null;
    const roster = (room.players as { user_id?: string; team?: string }[] | null) || [];
    const result = matchResult(status, team, winnerTeam);
    const winners = roster.filter((player) => player.team === winnerTeam).length || 1;
    const prizeTotal = Number(room.prize || 0);

    return {
      id: String(row.id),
      roomId: String(room.id || ""),
      mode: String(room.mode || "1v1"),
      entryFee: Number(room.entry_fee || 0),
      status,
      team,
      winnerTeam,
      result,
      prize: result === "win" ? Math.floor(prizeTotal / winners) : 0,
      createdAt: String(room.created_at || row.joined_at || ""),
    };
  });
}

export async function getMyChallengeHistory(userId: string, limit = 20): Promise<ChallengeHistoryItem[]> {
  const { data, error } = await supabase
    .from("challenge_participants")
    .select(
      "id, score, position, prize_coins, joined_at, challenge:challenges!inner(id, title, status, metric, closed_at, created_at, entry_fee)",
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data || []).map((row) => {
    const challenge = asRecord(row.challenge);
    return {
      id: String(row.id),
      challengeId: String(challenge.id || ""),
      title: String(challenge.title || "Desafío"),
      metric: metricLabel(challenge.metric ? String(challenge.metric) : null),
      status: String(challenge.status || "active"),
      position: row.position == null ? null : Number(row.position),
      score: Number(row.score || 0),
      prize: Number(row.prize_coins || 0),
      createdAt: String(challenge.closed_at || challenge.created_at || row.joined_at || ""),
    };
  });
}

export function walletMoveLabel(tx: WalletTransaction) {
  if (tx.description) return tx.description;
  if (tx.type === "credit") return "Crédito";
  return "Débito";
}

function matchResult(status: RoomStatus, team: RoomTeam, winnerTeam: RoomTeam | null): MatchHistoryItem["result"] {
  if (status === "cancelled") return "cancelled";
  if (status === "completed" && winnerTeam) return team === winnerTeam ? "win" : "loss";
  return "pending";
}

function asRecord(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    return (value[0] as Record<string, unknown> | undefined) || {};
  }
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return {};
}

export { roomStatusLabel };
