import { PAYOUT_INSTRUCTIONS } from "@/lib/payout-config";
import { supabase } from "@/lib/supabase";

export type CoinPackage = {
  id: string;
  name: string;
  coins: number;
  priceUsd: number;
  sortOrder: number;
};

export type MoneyRequestStatus = "pending" | "approved" | "rejected";
export type PayoutMethod = "ars" | "usdt";

export type DepositRequest = {
  id: string;
  userId: string;
  packageId: string | null;
  coins: number;
  priceUsd: number;
  method: PayoutMethod;
  receiptUrl: string;
  notes: string | null;
  status: MoneyRequestStatus;
  createdAt: string;
  userEmail?: string | null;
  userNickname?: string | null;
};

export type WithdrawalRequest = {
  id: string;
  userId: string;
  packageId: string | null;
  coins: number;
  amountUsd: number;
  method: PayoutMethod;
  payoutDetails: string;
  status: MoneyRequestStatus;
  createdAt: string;
  userEmail?: string | null;
  userNickname?: string | null;
};

function rpcError(error: { message: string }) {
  return error.message.replace("ERROR: ", "").replace(/^P0001:\s*/, "");
}

export async function getCoinPackages() {
  const { data, error } = await supabase
    .from("coin_packages")
    .select("id, name, coins, price_usd, sort_order")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);

  return (data || []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    coins: Number(row.coins),
    priceUsd: Number(row.price_usd),
    sortOrder: Number(row.sort_order),
  })) satisfies CoinPackage[];
}

export async function createDepositRequest(input: {
  userId: string;
  pkg: CoinPackage;
  method: PayoutMethod;
  receiptUrl: string;
  notes?: string;
}) {
  const { error } = await supabase.from("deposit_requests").insert([
    {
      user_id: input.userId,
      package_id: input.pkg.id,
      coins: input.pkg.coins,
      price_usd: input.pkg.priceUsd,
      method: input.method,
      receipt_url: input.receiptUrl.trim(),
      notes: input.notes?.trim() || null,
      status: "pending",
    },
  ]);

  if (error) throw new Error(error.message);
}

export async function getMyDeposits(userId: string) {
  const { data, error } = await supabase
    .from("deposit_requests")
    .select("id, user_id, package_id, coins, price_usd, method, receipt_url, notes, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => normalizeDeposit(row));
}

export async function getMyWithdrawals(userId: string) {
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("id, user_id, package_id, coins, amount_usd, method, payout_details, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => normalizeWithdrawal(row));
}

export async function requestWithdrawal(packageId: string, method: PayoutMethod, payoutDetails: string) {
  const { error } = await supabase.rpc("request_withdrawal", {
    p_package_id: packageId,
    p_method: method,
    p_payout_details: payoutDetails,
  });

  if (error) throw new Error(rpcError(error));
}

export async function getAdminDeposits() {
  const { data, error } = await supabase
    .from("deposit_requests")
    .select("id, user_id, package_id, coins, price_usd, method, receipt_url, notes, status, created_at, user:profiles!user_id(email, nickname)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => normalizeDeposit(row, embedProfile(row)));
}

export async function getAdminWithdrawals() {
  const { data, error } = await supabase
    .from("withdrawal_requests")
    .select("id, user_id, package_id, coins, amount_usd, method, payout_details, status, created_at, user:profiles!user_id(email, nickname)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => normalizeWithdrawal(row, embedProfile(row)));
}

export async function approveDeposit(id: string) {
  const { error } = await supabase.rpc("approve_deposit", { p_deposit_id: id });
  if (error) throw new Error(rpcError(error));
}

export async function rejectDeposit(id: string) {
  const { error } = await supabase.rpc("reject_deposit", { p_deposit_id: id });
  if (error) throw new Error(rpcError(error));
}

export async function approveWithdrawal(id: string) {
  const { error } = await supabase.rpc("approve_withdrawal", { p_withdrawal_id: id });
  if (error) throw new Error(rpcError(error));
}

export async function rejectWithdrawal(id: string) {
  const { error } = await supabase.rpc("reject_withdrawal", { p_withdrawal_id: id });
  if (error) throw new Error(rpcError(error));
}

export async function claimFirstAdmin() {
  const { error } = await supabase.rpc("claim_first_admin");
  if (error) throw new Error(rpcError(error));
}

export type PayoutSettings = {
  ars: { bank: string; cvu: string; alias: string; note: string };
  usdt: { network: string; address: string; note: string };
};

function withPayoutFallback(value: Partial<PayoutSettings> | null | undefined): PayoutSettings {
  return {
    ars: {
      bank: value?.ars?.bank || PAYOUT_INSTRUCTIONS.ars.bank,
      cvu: value?.ars?.cvu || PAYOUT_INSTRUCTIONS.ars.cvu,
      alias: value?.ars?.alias || PAYOUT_INSTRUCTIONS.ars.alias,
      note: value?.ars?.note || PAYOUT_INSTRUCTIONS.ars.note,
    },
    usdt: {
      network: value?.usdt?.network || PAYOUT_INSTRUCTIONS.usdt.network,
      address: value?.usdt?.address || PAYOUT_INSTRUCTIONS.usdt.address,
      note: value?.usdt?.note || PAYOUT_INSTRUCTIONS.usdt.note,
    },
  };
}

export async function getPayoutSettings(): Promise<PayoutSettings> {
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "payout").maybeSingle();
  if (error) throw new Error(error.message);
  return withPayoutFallback((data?.value || {}) as Partial<PayoutSettings>);
}

export async function updatePayoutSettings(value: PayoutSettings) {
  const { error } = await supabase.rpc("update_payout_settings", { p_value: value });
  if (error) throw new Error(rpcError(error));
}

function embedProfile(row: Record<string, unknown>) {
  const profile = (row.user || row.profiles) as { email?: string | null; nickname?: string | null } | { email?: string | null; nickname?: string | null }[] | null;
  if (Array.isArray(profile)) return profile[0] || null;
  return profile;
}

function normalizeDeposit(row: Record<string, unknown>, profile?: { email?: string | null; nickname?: string | null } | null): DepositRequest {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    packageId: row.package_id ? String(row.package_id) : null,
    coins: Number(row.coins || 0),
    priceUsd: Number(row.price_usd || 0),
    method: row.method === "usdt" ? "usdt" : "ars",
    receiptUrl: String(row.receipt_url || ""),
    notes: (row.notes as string | null) || null,
    status: (row.status as MoneyRequestStatus) || "pending",
    createdAt: String(row.created_at || ""),
    userEmail: profile?.email ?? null,
    userNickname: profile?.nickname ?? null,
  };
}

function normalizeWithdrawal(row: Record<string, unknown>, profile?: { email?: string | null; nickname?: string | null } | null): WithdrawalRequest {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    packageId: row.package_id ? String(row.package_id) : null,
    coins: Number(row.coins || 0),
    amountUsd: Number(row.amount_usd || 0),
    method: row.method === "usdt" ? "usdt" : "ars",
    payoutDetails: String(row.payout_details || ""),
    status: (row.status as MoneyRequestStatus) || "pending",
    createdAt: String(row.created_at || ""),
    userEmail: profile?.email ?? null,
    userNickname: profile?.nickname ?? null,
  };
}
