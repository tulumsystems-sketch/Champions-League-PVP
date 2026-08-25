import { supabase } from "@/lib/supabase";

export const ROOM_ENTRY_FEES = [1, 10, 15, 50] as const;
export const ROOM_MODES = ["1v1", "2v2", "3v3", "4v4"] as const;

export type RoomEntryFee = (typeof ROOM_ENTRY_FEES)[number];
export type RoomMode = (typeof ROOM_MODES)[number];
export type RoomTeam = "a" | "b";
export type RoomStatus = "waiting" | "in_progress" | "pending_review" | "disputed" | "completed" | "cancelled";
export type MatchResultStatus = "pending" | "approved" | "rejected";

export type MatchRoomPlayer = {
  id: string;
  userId: string;
  team: RoomTeam;
  nickname: string;
  joinedAt: string;
};

export type MatchRoomResult = {
  id: string;
  submittedBy: string;
  claimedWinnerTeam: RoomTeam;
  evidenceUrl: string;
  notes: string | null;
  status: MatchResultStatus;
  createdAt: string;
};

export type MatchRoom = {
  id: string;
  creatorId: string;
  creatorName: string;
  mode: RoomMode;
  entryFee: number;
  prize: number;
  status: RoomStatus;
  roomCode?: string;
  winnerTeam: RoomTeam | null;
  players: MatchRoomPlayer[];
  results: MatchRoomResult[];
  createdAt: string;
};

export type LeaderboardEntry = {
  id: string;
  userId: string;
  nickname: string;
  wins: number;
  participations: number;
  coinsWon: number;
  points: number;
};

export function roomTeamSize(mode: RoomMode) {
  if (mode === "1v1") return 1;
  if (mode === "2v2") return 2;
  if (mode === "3v3") return 3;
  return 4;
}

export function roomCapacity(mode: RoomMode) {
  return roomTeamSize(mode) * 2;
}

export function roomTeamPrize(entryFee: number, mode: RoomMode) {
  return Math.floor((roomCapacity(mode) * entryFee * 9) / 10);
}

export function playersOnTeam(room: MatchRoom, team: RoomTeam) {
  return room.players.filter((player) => player.team === team);
}

export function roomStatusLabel(status: RoomStatus) {
  if (status === "waiting") return "Armando";
  if (status === "in_progress") return "En juego";
  if (status === "pending_review") return "En revisión";
  if (status === "disputed") return "Conflicto";
  if (status === "completed") return "Cerrada";
  return "Cancelada";
}

export function roomStatusTone(status: RoomStatus): "cyan" | "orange" | "yellow" | "red" | "emerald" | "neutral" {
  if (status === "waiting") return "cyan";
  if (status === "in_progress") return "orange";
  if (status === "pending_review") return "yellow";
  if (status === "disputed") return "red";
  if (status === "completed") return "emerald";
  return "neutral";
}

const ROOM_SELECT =
  "id, creator_id, creator_name, mode, entry_fee, prize, status, room_code, winner_team, created_at, players:match_room_players(id, user_id, team, nickname, joined_at), results:match_room_results(id, submitted_by, claimed_winner_team, evidence_url, notes, status, created_at)";

export async function getActiveRooms(): Promise<MatchRoom[]> {
  const { data, error } = await supabase
    .from("match_rooms")
    .select(ROOM_SELECT)
    .in("status", ["waiting", "in_progress", "pending_review", "disputed"])
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map(mapRoom);
}

export async function getAdminMatchReviews(): Promise<MatchRoom[]> {
  const { data, error } = await supabase
    .from("match_rooms")
    .select(ROOM_SELECT)
    .in("status", ["pending_review", "disputed", "in_progress", "completed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw new Error(error.message);
  return (data || []).map(mapRoom);
}

function mapRoom(r: Record<string, unknown>): MatchRoom {
  const rawPlayers = (r.players as Record<string, unknown>[] | null) || [];
  const rawResults = (r.results as Record<string, unknown>[] | null) || [];

  return {
    id: String(r.id),
    creatorId: String(r.creator_id),
    creatorName: String(r.creator_name),
    mode: r.mode as RoomMode,
    entryFee: Number(r.entry_fee),
    prize: Number(r.prize),
    status: r.status as MatchRoom["status"],
    roomCode: r.room_code ? String(r.room_code) : undefined,
    winnerTeam: r.winner_team === "b" ? "b" : r.winner_team === "a" ? "a" : null,
    players: rawPlayers
      .map((player): MatchRoomPlayer => ({
        id: String(player.id),
        userId: String(player.user_id),
        team: player.team === "b" ? "b" : "a",
        nickname: String(player.nickname || "Jugador"),
        joinedAt: String(player.joined_at || ""),
      }))
      .sort((left, right) => left.joinedAt.localeCompare(right.joinedAt)),
    results: rawResults
      .map((result): MatchRoomResult => ({
        id: String(result.id),
        submittedBy: String(result.submitted_by),
        claimedWinnerTeam: result.claimed_winner_team === "b" ? "b" : "a",
        evidenceUrl: String(result.evidence_url || ""),
        notes: result.notes ? String(result.notes) : null,
        status: result.status === "approved" ? "approved" : result.status === "rejected" ? "rejected" : "pending",
        createdAt: String(result.created_at || ""),
      }))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
    createdAt: String(r.created_at),
  };
}

function rpcError(error: { message: string }) {
  return error.message.replace("ERROR: ", "").replace(/^P0001:\s*/, "");
}

export async function createMatchRoom(mode: RoomMode, entryFee: number, roomCode: string) {
  if (!ROOM_ENTRY_FEES.includes(entryFee as RoomEntryFee)) {
    throw new Error("La entrada tiene que ser 1, 10, 15 o 50 Coins.");
  }
  if (!ROOM_MODES.includes(mode)) {
    throw new Error("Modalidad inválida.");
  }

  const { data, error } = await supabase.rpc("create_match_room", {
    p_mode: mode,
    p_entry_fee: entryFee,
    p_room_code: roomCode,
  });

  if (error) throw new Error(rpcError(error));

  const { data: room, error: loadError } = await supabase.from("match_rooms").select(ROOM_SELECT).eq("id", data).maybeSingle();
  if (loadError || !room) throw new Error(loadError?.message || "Sala creada pero no se pudo leer.");
  return mapRoom(room);
}

export async function joinMatchRoom(roomId: string, team: RoomTeam) {
  const { error } = await supabase.rpc("join_match_room", { p_room_id: roomId, p_team: team });
  if (error) throw new Error(rpcError(error));
}

export async function leaveMatchRoom(roomId: string) {
  const { error } = await supabase.rpc("leave_match_room", { p_room_id: roomId });
  if (error) throw new Error(rpcError(error));
}

export async function cancelMatchRoom(roomId: string) {
  const { error } = await supabase.rpc("cancel_match_room", { p_room_id: roomId });
  if (error) throw new Error(rpcError(error));
}

export async function submitMatchResult(roomId: string, winnerTeam: RoomTeam, evidenceUrl: string, notes?: string) {
  const { error } = await supabase.rpc("submit_match_result", {
    p_room_id: roomId,
    p_claimed_winner_team: winnerTeam,
    p_evidence_url: evidenceUrl,
    p_notes: notes?.trim() || null,
  });
  if (error) throw new Error(rpcError(error));
}

export async function approveMatchResult(resultId: string) {
  const { error } = await supabase.rpc("approve_match_result", { p_result_id: resultId });
  if (error) throw new Error(rpcError(error));
}

export async function rejectMatchResult(resultId: string) {
  const { error } = await supabase.rpc("reject_match_result", { p_result_id: resultId });
  if (error) throw new Error(rpcError(error));
}

export async function resolveMatchRoom(roomId: string, winnerTeam: RoomTeam) {
  const { error } = await supabase.rpc("resolve_match_room", { p_room_id: roomId, p_winner_team: winnerTeam });
  if (error) throw new Error(rpcError(error));
}

export async function adminVoidMatchRoom(roomId: string) {
  const { error } = await supabase.rpc("admin_void_match_room", { p_room_id: roomId });
  if (error) throw new Error(rpcError(error));
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("id, user_id, nickname, wins, participations, coins_won, points")
    .order("points", { ascending: false })
    .order("wins", { ascending: false })
    .order("coins_won", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id || ""),
    nickname: String(row.nickname || "Jugador"),
    wins: Number(row.wins || 0),
    participations: Number(row.participations || 0),
    coinsWon: Number(row.coins_won || 0),
    points: Number(row.points || 0),
  }));
}
