"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Clock, Loader2, PlusCircle } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import {
  createDepositRequest,
  getCoinPackages,
  getMyDeposits,
  getMyWithdrawals,
  getPayoutSettings,
  requestWithdrawal,
  type CoinPackage,
  type DepositRequest,
  type PayoutMethod,
  type PayoutSettings,
  type WithdrawalRequest,
} from "@/lib/economy";
import { PAYOUT_INSTRUCTIONS } from "@/lib/payout-config";
import type { AuthenticatedProfile } from "@/lib/profile";
import { DEPOSIT_RECEIPTS_BUCKET, uploadUserImage } from "@/lib/storage-uploads";
import { getOrCreateWallet, getWalletTransactions, type Wallet, type WalletTransaction } from "@/lib/wallet";
import { subscribeRealtime } from "@/lib/realtime";

type WalletState =
  | { status: "loading" }
  | { status: "ready"; wallet: Wallet; transactions: WalletTransaction[] }
  | { status: "error"; message: string };

export default function WalletPage() {
  return (
    <AuthenticatedLayout>
      {(auth) => (
        <AppLayout auth={auth}>
          <WalletContent auth={auth} />
        </AppLayout>
      )}
    </AuthenticatedLayout>
  );
}

function WalletContent({ auth }: { auth: AuthenticatedProfile }) {
  const [state, setState] = useState<WalletState>({ status: "loading" });
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const reload = async () => {
    const wallet = await getOrCreateWallet(auth.user.id);
    const [transactions, pkgs, myDeposits, myWithdrawals] = await Promise.all([
      getWalletTransactions(wallet.id, 30),
      getCoinPackages(),
      getMyDeposits(auth.user.id),
      getMyWithdrawals(auth.user.id),
    ]);
    setState({ status: "ready", wallet, transactions });
    setPackages(pkgs);
    setDeposits(myDeposits);
    setWithdrawals(myWithdrawals);
  };

  useEffect(() => {
    let active = true;
    reload()
      .catch((error) => {
        if (!active) return;
        setState({ status: "error", message: error instanceof Error ? error.message : "No pudimos cargar tu wallet." });
      });
    const unsubscribe = subscribeRealtime(`wallet-page:${auth.user.id}`, ["wallets", "wallet_transactions", "deposit_requests", "withdrawal_requests"], () => {
      void reload().catch(() => {});
    });
    return () => {
      active = false;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user.id]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-neutral-900/85 p-6 md:flex-row md:items-center md:p-8">
        <div>
          <StatusBadge tone="yellow">Wallet</StatusBadge>
          <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">Coins de la arena</h1>
          <p className="mt-2 max-w-xl text-sm text-neutral-400">
            1 Coin = 1 USD. Recargás por transferencia, un admin confirma y acredita. Cuando retires, se debitan Coins y
            el admin te paga.
          </p>
          <p className="mt-6 text-4xl font-black text-white">
            {state.status === "ready" ? `${state.wallet.balance} Coins` : "..."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setDepositOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white">
            <PlusCircle className="size-4" /> Cargar saldo
          </button>
          <button type="button" onClick={() => setWithdrawOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm font-black text-white">
            <ArrowUpFromLine className="size-4" /> Retirar
          </button>
        </div>
      </section>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
          <CheckCircle2 className="size-5" />
          {successMsg}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-widest text-neutral-500">{pkg.name}</p>
            <p className="mt-2 text-2xl font-black text-white">{pkg.coins} Coins</p>
            <p className="text-sm text-orange-200">${pkg.priceUsd} USD</p>
          </div>
        ))}
      </section>

      <RequestList title="Tus recargas" rows={deposits.map((row) => ({ id: row.id, title: `+${row.coins} Coins · ${row.method.toUpperCase()}`, status: row.status, date: row.createdAt }))} />
      <RequestList title="Tus retiros" rows={withdrawals.map((row) => ({ id: row.id, title: `-${row.coins} Coins · ${row.method.toUpperCase()}`, status: row.status, date: row.createdAt }))} />

      <section className="rounded-3xl border border-white/10 bg-neutral-900/85 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Movimientos</h2>
          <Clock className="size-5 text-orange-300" />
        </div>
        {state.status === "ready" && state.transactions.length === 0 && <p className="text-sm text-neutral-500">Todavía no hay movimientos.</p>}
        {state.status === "ready" &&
          state.transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between border-t border-white/10 py-3">
              <div>
                <p className="text-sm font-bold text-white">{transaction.description}</p>
                <p className="text-xs text-neutral-500">{formatDate(transaction.created_at)}</p>
              </div>
              <span className={transaction.type === "credit" ? "font-black text-emerald-300" : "font-black text-red-300"}>
                {transaction.type === "credit" ? "+" : "-"}
                {transaction.amount} Coins
              </span>
            </div>
          ))}
      </section>

      {depositOpen && (
        <MoneyModal title="Cargar saldo" onClose={() => setDepositOpen(false)}>
          <DepositForm
            packages={packages}
            userId={auth.user.id}
            onDone={async () => {
              setDepositOpen(false);
              setSuccessMsg("Comprobante enviado. Un admin va a revisar la transferencia y acreditar tus Coins.");
              await reload();
            }}
          />
        </MoneyModal>
      )}

      {withdrawOpen && (
        <MoneyModal title="Retirar Coins" onClose={() => setWithdrawOpen(false)}>
          <WithdrawForm
            packages={packages}
            onDone={async () => {
              setWithdrawOpen(false);
              setSuccessMsg("Retiro pedido. Se debitaron tus Coins. El admin te paga y marca la solicitud como pagada.");
              await reload();
            }}
          />
        </MoneyModal>
      )}
    </div>
  );
}

function DepositForm({ packages, userId, onDone }: { packages: CoinPackage[]; userId: string; onDone: () => Promise<void> }) {
  const [pkgId, setPkgId] = useState(packages[0]?.id || "");
  const [method, setMethod] = useState<PayoutMethod>("ars");
  const [receipt, setReceipt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payout, setPayout] = useState<PayoutSettings>(PAYOUT_INSTRUCTIONS);
  const pkg = packages.find((item) => item.id === pkgId) || packages[0];

  useEffect(() => {
    getPayoutSettings()
      .then(setPayout)
      .catch(() => setPayout(PAYOUT_INSTRUCTIONS));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pkg) return;
    setSubmitting(true);
    setError(null);
    try {
      const input = event.currentTarget.elements.namedItem("receiptFile") as HTMLInputElement | null;
      const file = input?.files?.[0];
      let receiptUrl = receipt.trim();
      if (file) {
        const uploaded = await uploadUserImage(DEPOSIT_RECEIPTS_BUCKET, [userId], file);
        receiptUrl = uploaded.url;
      }
      if (!receiptUrl) {
        throw new Error("Subí el comprobante o pegá un link.");
      }
      await createDepositRequest({ userId, pkg, method, receiptUrl, notes });
      await onDone();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo enviar la recarga.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PackagePicker packages={packages} value={pkgId} onChange={setPkgId} />
      <MethodPicker value={method} onChange={setMethod} />
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-neutral-300">
        {method === "ars" ? (
          <>
            <p><strong>Banco:</strong> {payout.ars.bank}</p>
            <p><strong>CVU:</strong> {payout.ars.cvu}</p>
            <p><strong>Alias:</strong> {payout.ars.alias}</p>
            <p className="mt-2 text-neutral-500">{payout.ars.note}</p>
          </>
        ) : (
          <>
            <p><strong>Red:</strong> {payout.usdt.network}</p>
            <p><strong>Address:</strong> {payout.usdt.address}</p>
            <p className="mt-2 text-neutral-500">{payout.usdt.note}</p>
          </>
        )}
        {pkg && <p className="mt-2 font-bold text-orange-200">A transferir: ${pkg.priceUsd} USD / {pkg.coins} Coins</p>}
      </div>
      <label className="block space-y-1 text-sm text-neutral-300">
        <span>Comprobante</span>
        <input
          name="receiptFile"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="block w-full text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
        />
      </label>
      <input value={receipt} onChange={(event) => setReceipt(event.target.value)} placeholder="O pegá un link (Drive, Imgur)" className={inputClass} />
      <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notas opcionales (titular, últimos 4, hash TX)" className={inputClass} />
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-black text-white disabled:opacity-60">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowDownToLine className="size-4" />}
        Enviar a revisión admin
      </button>
    </form>
  );
}

function WithdrawForm({ packages, onDone }: { packages: CoinPackage[]; onDone: () => Promise<void> }) {
  const [pkgId, setPkgId] = useState(packages[0]?.id || "");
  const [method, setMethod] = useState<PayoutMethod>("ars");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestWithdrawal(pkgId, method, details);
      await onDone();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo pedir el retiro.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PackagePicker packages={packages} value={pkgId} onChange={setPkgId} />
      <MethodPicker value={method} onChange={setMethod} />
      <textarea
        required
        minLength={6}
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        placeholder={method === "ars" ? "CBU / alias para cobrarte" : "Wallet USDT y red"}
        className={`${inputClass} min-h-24`}
      />
      <p className="text-xs text-neutral-500">Se debitan las Coins ahora. Si el admin rechaza, se te devuelven.</p>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-black text-white disabled:opacity-60">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpFromLine className="size-4" />}
        Pedir retiro
      </button>
    </form>
  );
}

function PackagePicker({ packages, value, onChange }: { packages: CoinPackage[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          type="button"
          onClick={() => onChange(pkg.id)}
          className={`rounded-xl border p-3 text-left ${value === pkg.id ? "border-orange-500 bg-orange-500/10 text-white" : "border-white/10 text-neutral-300"}`}
        >
          <p className="text-sm font-black">{pkg.coins} Coins</p>
          <p className="text-xs">${pkg.priceUsd} USD</p>
        </button>
      ))}
    </div>
  );
}

function MethodPicker({ value, onChange }: { value: PayoutMethod; onChange: (method: PayoutMethod) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["ars", "usdt"] as const).map((method) => (
        <button
          key={method}
          type="button"
          onClick={() => onChange(method)}
          className={`rounded-xl border p-3 text-sm font-bold ${value === method ? "border-cyan-400 bg-cyan-500/10 text-white" : "border-white/10 text-neutral-400"}`}
        >
          {method === "ars" ? "ARS" : "USDT"}
        </button>
      ))}
    </div>
  );
}

function MoneyModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-neutral-900 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-neutral-400">Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RequestList({ title, rows }: { title: string; rows: { id: string; title: string; status: string; date: string }[] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-neutral-900/80 p-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      {rows.length === 0 ? <p className="mt-2 text-sm text-neutral-500">Sin solicitudes.</p> : null}
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
            <div>
              <p className="font-bold text-white">{row.title}</p>
              <p className="text-xs text-neutral-500">{formatDate(row.date)}</p>
            </div>
            <StatusBadge tone={row.status === "approved" ? "emerald" : row.status === "rejected" ? "red" : "orange"}>{row.status}</StatusBadge>
          </div>
        ))}
      </div>
    </section>
  );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none";

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
