"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Clock, Loader2, PlusCircle } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { ArenaModal } from "@/components/layout/ArenaModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { CoinChip } from "@/components/motion/CoinChip";
import {
  createDepositRequest,
  getCoinPackages,
  getMyDeposits,
  getMyWithdrawals,
  getPayoutSettings,
  moneyRequestStatusLabel,
  moneyRequestStatusTone,
  requestWithdrawal,
  type CoinPackage,
  type DepositRequest,
  type PayoutMethod,
  type PayoutSettings,
  type WithdrawalRequest,
} from "@/lib/economy";
import { isPlaceholderArs, isPlaceholderUsdt, PAYOUT_INSTRUCTIONS } from "@/lib/payout-config";
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
  const [selectedPkgId, setSelectedPkgId] = useState<string>("");
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
    <div className="arena-page">
      <PageHeader
        badge="Wallet"
        badgeTone="yellow"
        title="Coins de la arena"
        description="1 Coin = 1 USD. Recargás por transferencia, un admin confirma y acredita. Cuando retires, se debitan Coins y el admin te paga."
        actions={
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedPkgId(packages[0]?.id || "");
                setDepositOpen(true);
              }}
              disabled={state.status !== "ready" || packages.length === 0}
              className="arena-btn disabled:opacity-60"
            >
              <PlusCircle className="size-4" /> Cargar saldo
            </button>
            <button
              type="button"
              onClick={() => setWithdrawOpen(true)}
              disabled={state.status !== "ready" || packages.length === 0 || Number(state.wallet.balance) <= 0}
              className="arena-btn-ghost disabled:opacity-60"
            >
              <ArrowUpFromLine className="size-4" /> Retirar
            </button>
          </div>
        }
      />
      <section className="arena-panel relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-amber-400/10 blur-3xl" />
        <p className="arena-kicker">Tu saldo</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          {state.status === "ready" ? (
            <CoinChip balance={Number(state.wallet.balance)} className="border-0 bg-transparent px-0 py-0 text-3xl" />
          ) : (
            <p className="font-heading text-3xl font-bold text-white">{state.status === "error" ? "—" : "..."}</p>
          )}
          <p className="text-sm text-neutral-400">1 Coin = 1 USD</p>
        </div>
      </section>

      {state.status === "error" && (
        <p className="arena-err p-4 text-sm">{state.message}</p>
      )}

      {state.status === "ready" && packages.length === 0 && (
        <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          Todavía no hay paquetes de Coins. Un admin tiene que publicarlos en el panel.
        </p>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">
          <CheckCircle2 className="size-5" />
          {successMsg}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => {
              setSelectedPkgId(pkg.id);
              setDepositOpen(true);
            }}
            className="arena-stat text-left transition hover:border-arena/40"
          >
            <p className="text-xs uppercase tracking-widest text-neutral-500">{pkg.name}</p>
            <p className="mt-2 text-2xl font-black text-white">{pkg.coins} Coins</p>
            <p className="text-sm text-arena">${pkg.priceUsd} USD</p>
            <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-neutral-500">Cargar este paquete</p>
          </button>
        ))}
      </section>

      <RequestList
        title="Tus recargas"
        kind="deposit"
        rows={deposits.map((row) => ({ id: row.id, title: `+${row.coins} Coins · ${row.method.toUpperCase()}`, status: row.status, date: row.createdAt }))}
      />
      <RequestList
        title="Tus retiros"
        kind="withdrawal"
        rows={withdrawals.map((row) => ({ id: row.id, title: `-${row.coins} Coins · ${row.method.toUpperCase()}`, status: row.status, date: row.createdAt }))}
      />

      <section className="arena-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Movimientos</h2>
          <Clock className="size-5 text-arena" />
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
        <ArenaModal title="Cargar saldo" onClose={() => setDepositOpen(false)}>
          <DepositForm
            key={selectedPkgId || "deposit"}
            packages={packages}
            userId={auth.user.id}
            initialPkgId={selectedPkgId}
            onDone={async () => {
              setDepositOpen(false);
              setSuccessMsg("Comprobante enviado. Un admin va a revisar la transferencia y acreditar tus Coins.");
              await reload();
            }}
          />
        </ArenaModal>
      )}

      {withdrawOpen && (
        <ArenaModal title="Retirar Coins" onClose={() => setWithdrawOpen(false)}>
          <WithdrawForm
            packages={packages}
            onDone={async () => {
              setWithdrawOpen(false);
              setSuccessMsg("Retiro pedido. Se debitaron tus Coins. El admin te paga y marca la solicitud como pagada.");
              await reload();
            }}
          />
        </ArenaModal>
      )}
    </div>
  );
}

function DepositForm({
  packages,
  userId,
  initialPkgId,
  onDone,
}: {
  packages: CoinPackage[];
  userId: string;
  initialPkgId?: string;
  onDone: () => Promise<void>;
}) {
  const [pkgId, setPkgId] = useState(initialPkgId || packages[0]?.id || "");
  const [method, setMethod] = useState<PayoutMethod>("ars");
  const [receipt, setReceipt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payout, setPayout] = useState<PayoutSettings>(PAYOUT_INSTRUCTIONS);
  const pkg = packages.find((item) => item.id === pkgId) || packages[0];
  const payoutReady = method === "ars" ? !isPlaceholderArs(payout) : !isPlaceholderUsdt(payout);

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
      if (!payoutReady) {
        throw new Error("Faltan los datos de transferencia. Pedile al admin que los cargue en /admin.");
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
        {!payoutReady ? (
          <p className="text-amber-200">
            El admin todavía no cargó los datos de {method === "ars" ? "CBU/alias" : "USDT"} en /admin. No transfieras hasta que aparezcan.
          </p>
        ) : method === "ars" ? (
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
        {pkg && <p className="mt-2 font-bold text-arena">A transferir: ${pkg.priceUsd} USD / {pkg.coins} Coins</p>}
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
      <button type="submit" disabled={submitting || !payoutReady} className="arena-btn w-full disabled:opacity-60">
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
      <button type="submit" disabled={submitting} className="arena-btn w-full disabled:opacity-60">
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
          className={`rounded-xl border p-3 text-left ${value === pkg.id ? "border-arena bg-arena/10 text-white" : "border-white/10 text-neutral-300"}`}
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
          className={`rounded-xl border p-3 text-sm font-bold ${value === method ? "border-arena/40 bg-arena/10 text-white" : "border-white/10 text-neutral-400"}`}
        >
          {method === "ars" ? "ARS" : "USDT"}
        </button>
      ))}
    </div>
  );
}

function RequestList({
  title,
  kind,
  rows,
}: {
  title: string;
  kind: "deposit" | "withdrawal";
  rows: { id: string; title: string; status: string; date: string }[];
}) {
  return (
    <section className="arena-panel p-5">
      <h2 className="text-lg font-black text-white">{title}</h2>
      {rows.length === 0 ? <p className="mt-2 text-sm text-neutral-500">Sin solicitudes.</p> : null}
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
            <div>
              <p className="font-bold text-white">{row.title}</p>
              <p className="text-xs text-neutral-500">{formatDate(row.date)}</p>
            </div>
            <StatusBadge tone={moneyRequestStatusTone(row.status)}>{moneyRequestStatusLabel(row.status, kind)}</StatusBadge>
          </div>
        ))}
      </div>
    </section>
  );
}

const inputClass = "arena-input";

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
