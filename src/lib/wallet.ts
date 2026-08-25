import { supabase } from "@/lib/supabase";

export type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  created_at: string | null;
};

export type WalletTransactionType = "credit" | "debit";

export type WalletTransaction = {
  id: string;
  wallet_id: string;
  type: WalletTransactionType;
  amount: number;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string | null;
};

type CreateWalletTransactionInput = {
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  referenceType?: string | null;
  referenceId?: string | null;
};

export async function getOrCreateWallet(userId: string) {
  const existingWallet = await getWalletByUserId(userId);

  if (existingWallet) {
    return existingWallet;
  }

  const { data, error } = await supabase
    .from("wallets")
    .insert([{ user_id: userId, balance: 0 }])
    .select("id, user_id, balance, created_at")
    .single();

  if (error) {
    if (isDuplicateWalletError(error.message)) {
      const wallet = await getWalletByUserId(userId);
      if (wallet) return wallet;
    }

    throw new Error(error.message);
  }

  return normalizeWallet(data);
}

export async function getWalletTransactions(walletId: string, limit = 30) {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("id, wallet_id, type, amount, description, reference_type, reference_id, created_at")
    .eq("wallet_id", walletId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(normalizeWalletTransaction);
}

export async function createWalletTransaction({
  walletId,
  type,
  amount,
  description,
  referenceType = null,
  referenceId = null,
}: CreateWalletTransactionInput) {
  if (amount <= 0) {
    throw new Error("El monto del movimiento debe ser mayor a 0.");
  }

  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert([
      {
        wallet_id: walletId,
        type,
        amount,
        description,
        reference_type: referenceType,
        reference_id: referenceId,
      },
    ])
    .select("id, wallet_id, type, amount, description, reference_type, reference_id, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeWalletTransaction(data);
}

export async function debitOwnCoins(amount: number, description: string, referenceType?: string | null, referenceId?: string | null) {
  const { error } = await supabase.rpc("debit_own_coins", {
    p_amount: amount,
    p_description: description,
    p_reference_type: referenceType ?? null,
    p_reference_id: referenceId ?? null,
  });

  if (error) {
    throw new Error(error.message.replace("ERROR: ", ""));
  }
}

async function getWalletByUserId(userId: string) {
  const { data, error } = await supabase
    .from("wallets")
    .select("id, user_id, balance, created_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeWallet(data) : null;
}

function normalizeWallet(wallet: unknown): Wallet {
  const value = wallet as Partial<Wallet>;

  return {
    id: String(value.id),
    user_id: String(value.user_id),
    balance: Number(value.balance || 0),
    created_at: value.created_at || null,
  };
}

function normalizeWalletTransaction(transaction: unknown): WalletTransaction {
  const value = transaction as Partial<WalletTransaction>;

  return {
    id: String(value.id),
    wallet_id: String(value.wallet_id),
    type: value.type === "debit" ? "debit" : "credit",
    amount: Number(value.amount || 0),
    description: value.description || null,
    reference_type: value.reference_type || null,
    reference_id: value.reference_id || null,
    created_at: value.created_at || null,
  };
}

function isDuplicateWalletError(message: string) {
  return message.toLowerCase().includes("duplicate");
}
