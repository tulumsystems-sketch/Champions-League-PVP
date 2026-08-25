import { supabase } from "@/lib/supabase";

export type AdminUserStatus = "active" | "suspended";

export type AdminUserRow = {
  id: string;
  email: string | null;
  nickname: string | null;
  freefireUid: string | null;
  role: string;
  status: AdminUserStatus;
  balance: number;
  coinsWon: number;
  createdAt: string | null;
};

function rpcError(error: { message: string }) {
  return error.message.replace("ERROR: ", "").replace(/^P0001:\s*/, "");
}

function normalizeAdminUser(row: Record<string, unknown>): AdminUserRow {
  const status = String(row.status || "active") === "suspended" ? "suspended" : "active";
  return {
    id: String(row.id),
    email: (row.email as string | null) || null,
    nickname: (row.nickname as string | null) || null,
    freefireUid: (row.freefire_uid as string | null) || null,
    role: String(row.role || "player"),
    status,
    balance: Number(row.balance || 0),
    coinsWon: Number(row.coins_won || 0),
    createdAt: (row.created_at as string | null) || null,
  };
}

export async function listAdminUsers(search?: string) {
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: search?.trim() || null,
  });

  if (error) throw new Error(rpcError(error));
  return ((data as Record<string, unknown>[]) || []).map(normalizeAdminUser);
}

export async function setAdminUserStatus(userId: string, status: AdminUserStatus) {
  const { error } = await supabase.rpc("admin_set_user_status", {
    p_user_id: userId,
    p_status: status,
  });

  if (error) throw new Error(rpcError(error));
}

export async function adjustAdminUserCoins(input: {
  userId: string;
  amount: number;
  reason: string;
  countAsPrize: boolean;
}) {
  const { data, error } = await supabase.rpc("admin_adjust_coins", {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_reason: input.reason,
    p_count_as_prize: input.countAsPrize,
  });

  if (error) throw new Error(rpcError(error));
  return Number(data || 0);
}
