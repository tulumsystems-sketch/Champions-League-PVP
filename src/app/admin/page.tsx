"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { AdminChallenges } from "@/components/admin/AdminChallenges";
import { AdminMatchReviews } from "@/components/admin/AdminMatchReviews";
import { AdminPayoutSettings } from "@/components/admin/AdminPayoutSettings";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import {
  approveDeposit,
  approveWithdrawal,
  claimFirstAdmin,
  getAdminDeposits,
  getAdminWithdrawals,
  getCoinPackages,
  rejectDeposit,
  rejectWithdrawal,
  type CoinPackage,
  type DepositRequest,
  type WithdrawalRequest,
} from "@/lib/economy";
import type { AuthenticatedProfile } from "@/lib/profile";
import { isAdmin } from "@/lib/profile";
import { subscribeRealtime } from "@/lib/realtime";

export default function AdminPage() {
  return (
    <AuthenticatedLayout>
      {(auth) => (
        <AppLayout auth={auth}>
          <AdminContent auth={auth} />
        </AppLayout>
      )}
    </AuthenticatedLayout>
  );
}

function AdminContent({ auth }: { auth: AuthenticatedProfile }) {
  const admin = isAdmin(auth.profile);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(admin);

  const reload = async () => {
    const [nextDeposits, nextWithdrawals, nextPackages] = await Promise.all([
      getAdminDeposits(),
      getAdminWithdrawals(),
      getCoinPackages(),
    ]);
    setDeposits(nextDeposits);
    setWithdrawals(nextWithdrawals);
    setPackages(nextPackages);
  };

  useEffect(() => {
    if (!admin) return;
    let active = true;
    reload()
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "No se pudo cargar el panel.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const unsubscribe = subscribeRealtime("admin-money", ["deposit_requests", "withdrawal_requests"], () => {
      void reload().catch(() => {});
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [admin]);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      await claimFirstAdmin();
      window.location.reload();
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "No se pudo reclamar el rol admin.");
    } finally {
      setClaiming(false);
    }
  };

  if (!admin) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
        <ShieldCheck className="mx-auto size-10 text-orange-300" />
        <h1 className="text-3xl font-black text-white">Panel de administración</h1>
        <p className="text-sm text-neutral-400">
          Todavía no sos admin. Si no hay ninguno en el proyecto, podés reclamar el primer rol de administrador.
        </p>
        {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        <button type="button" disabled={claiming} onClick={handleClaim} className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          {claiming ? "Reclamando..." : "Reclamar primer admin"}
        </button>
      </div>
    );
  }

  return (
    <div className="arena-page">
      <PageHeader
        badge="Admin"
        title="Operaciones de Coins"
        description="Jugadores, recargas, retiros, resultados de salas, desafíos, ajuste de premios y datos de cobro."
      />

      {error && <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>}

      <AdminUsers currentUserId={auth.user.id} />

      <section className="grid gap-3 sm:grid-cols-3">
        {packages.map((pkg) => (
          <div key={pkg.id} className="arena-stat">
            <p className="text-xs text-neutral-500">{pkg.name}</p>
            <p className="text-lg font-black text-white">{pkg.coins} Coins = ${pkg.priceUsd}</p>
          </div>
        ))}
      </section>

      {loading ? (
        <div className="flex items-center gap-2 text-neutral-300">
          <Loader2 className="size-4 animate-spin" /> Cargando solicitudes...
        </div>
      ) : (
        <>
          <AdminTable
            title="Recargas pendientes"
            rows={deposits}
            kind="deposit"
            onApprove={async (id) => {
              setError(null);
              try {
                await approveDeposit(id);
                await reload();
              } catch (actionError) {
                setError(actionError instanceof Error ? actionError.message : "No se pudo aprobar la recarga.");
              }
            }}
            onReject={async (id) => {
              setError(null);
              try {
                await rejectDeposit(id);
                await reload();
              } catch (actionError) {
                setError(actionError instanceof Error ? actionError.message : "No se pudo rechazar la recarga.");
              }
            }}
          />
          <AdminTable
            title="Retiros pendientes"
            rows={withdrawals}
            kind="withdrawal"
            onApprove={async (id) => {
              setError(null);
              try {
                await approveWithdrawal(id);
                await reload();
              } catch (actionError) {
                setError(actionError instanceof Error ? actionError.message : "No se pudo marcar el retiro como pagado.");
              }
            }}
            onReject={async (id) => {
              setError(null);
              try {
                await rejectWithdrawal(id);
                await reload();
              } catch (actionError) {
                setError(actionError instanceof Error ? actionError.message : "No se pudo rechazar el retiro.");
              }
            }}
          />
        </>
      )}

      <AdminMatchReviews />
      <AdminChallenges />
      <AdminPayoutSettings />
    </div>
  );
}

function AdminTable({
  title,
  rows,
  kind,
  onApprove,
  onReject,
}: {
  title: string;
  rows: Array<DepositRequest | WithdrawalRequest>;
  kind: "deposit" | "withdrawal";
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const pending = rows.filter((row) => row.status === "pending");
  const others = rows.filter((row) => row.status !== "pending");

  return (
    <section className="arena-panel p-5">
      <h2 className="text-xl font-black text-white">{title}</h2>
      {pending.length === 0 && <p className="mt-2 text-sm text-neutral-500">No hay pendientes.</p>}
      <div className="mt-4 space-y-3">
        {pending.map((row) => (
          <AdminRow key={row.id} row={row} kind={kind} onApprove={onApprove} onReject={onReject} />
        ))}
        {others.slice(0, 8).map((row) => (
          <AdminRow key={row.id} row={row} kind={kind} />
        ))}
      </div>
    </section>
  );
}

function AdminRow({
  row,
  kind,
  onApprove,
  onReject,
}: {
  row: DepositRequest | WithdrawalRequest;
  kind: "deposit" | "withdrawal";
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const extra = kind === "deposit" ? (row as DepositRequest).receiptUrl : (row as WithdrawalRequest).payoutDetails;
  const notes = kind === "deposit" ? (row as DepositRequest).notes : null;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-white">{row.userNickname || row.userEmail || row.userId}</p>
          <p className="text-sm text-neutral-400">
            {row.coins} Coins · ${"priceUsd" in row ? row.priceUsd : row.amountUsd} USD · {row.method.toUpperCase()}
          </p>
          {kind === "deposit" && extra ? (
            <div className="mt-2 space-y-2">
              {isImageUrl(extra) ? (
                <a href={extra} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={extra} alt="Comprobante" className="max-h-32 rounded-lg object-contain bg-black" />
                </a>
              ) : null}
              <a href={extra} className="block break-all text-xs text-cyan-300" target="_blank" rel="noreferrer">
                Ver comprobante
              </a>
            </div>
          ) : (
            <p className="mt-1 break-all text-xs text-cyan-200">{extra}</p>
          )}
          {notes ? <p className="mt-1 text-xs text-neutral-500">{notes}</p> : null}
        </div>
        <StatusBadge tone={row.status === "approved" ? "emerald" : row.status === "rejected" ? "red" : "orange"}>{row.status}</StatusBadge>
      </div>
      {row.status === "pending" && onApprove && onReject && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onApprove(row.id);
              } finally {
                setBusy(false);
              }
            }}
        className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
          >
            {kind === "deposit" ? "Aprobar y acreditar" : "Marcar pagado"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onReject(row.id);
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-neutral-200 disabled:opacity-60"
          >
            {kind === "deposit" ? "Rechazar" : "Rechazar y devolver Coins"}
          </button>
        </div>
      )}
    </article>
  );
}

function isImageUrl(value: string) {
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(value) || value.includes("/storage/v1/object/public/");
}
