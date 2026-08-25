"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Search, Users } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";
import {
  adjustAdminUserCoins,
  listAdminUsers,
  setAdminUserStatus,
  type AdminUserRow,
} from "@/lib/admin-users";

type AdminUsersProps = {
  currentUserId: string;
};

export function AdminUsers({ currentUserId }: AdminUsersProps) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<AdminUserRow | null>(null);

  const reload = async (query = search) => {
    setUsers(await listAdminUsers(query));
  };

  useEffect(() => {
    let active = true;
    const handle = window.setTimeout(() => {
      reload(search)
        .catch((loadError) => {
          if (active) setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los jugadores.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, search ? 280 : 0);

    return () => {
      active = false;
      window.clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce search against the live RPC
  }, [search]);

  const suspendedCount = useMemo(() => users.filter((user) => user.status === "suspended").length, [users]);

  const run = async (userId: string, action: () => Promise<void>) => {
    setBusyId(userId);
    setError(null);
    try {
      await action();
      await reload();
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo completar la acción.");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-neutral-900/85 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Jugadores</h2>
          <p className="mt-1 text-xs text-neutral-500">
            UID, saldo y estado. Suspender corta juego, recargas y retiros. El ajuste de Coins sirve para premios mal
            pagados o conflictos.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Users className="size-4 text-orange-300" />
          {users.length} listados
          {suspendedCount > 0 ? ` · ${suspendedCount} suspendidos` : ""}
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5">
        <Search className="size-4 text-neutral-500" />
        <input
          value={search}
          onChange={(event) => {
            setLoading(true);
            setSearch(event.target.value);
          }}
          placeholder="Buscar nickname, email o UID"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
        />
      </label>

      {error && <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="size-4 animate-spin" /> Cargando jugadores...
        </p>
      ) : users.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No hay jugadores con ese filtro.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const busy = busyId === user.id;
            return (
              <article key={user.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white">
                      {user.nickname?.trim() || user.email || "Jugador"}
                      {isSelf ? <span className="ml-2 text-xs font-semibold text-orange-300">vos</span> : null}
                    </p>
                    <p className="truncate text-sm text-neutral-400">{user.email || "Sin email"}</p>
                    <p className="mt-1 text-xs text-cyan-200">UID {user.freefireUid?.trim() || "pendiente"}</p>
                    <p className="mt-1 text-sm font-black text-white">
                      {user.balance} Coins
                      <span className="ml-2 text-xs font-semibold text-neutral-500">ranking {user.coinsWon}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={user.role === "admin" ? "orange" : "neutral"}>{user.role}</StatusBadge>
                    <StatusBadge tone={user.status === "active" ? "emerald" : "red"}>{user.status}</StatusBadge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setAdjusting(user)}
                    className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
                  >
                    Ajustar Coins
                  </button>
                  <button
                    type="button"
                    disabled={busy || isSelf}
                    onClick={() =>
                      run(user.id, () => setAdminUserStatus(user.id, user.status === "active" ? "suspended" : "active"))
                    }
                    className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-neutral-200 disabled:opacity-60"
                  >
                    {busy ? "..." : user.status === "active" ? "Suspender" : "Activar"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {adjusting ? (
        <AdjustCoinsModal
          user={adjusting}
          busy={busyId === adjusting.id}
          onClose={() => setAdjusting(null)}
          onSubmit={async (amount, reason, countAsPrize) => {
            const ok = await run(adjusting.id, async () => {
              await adjustAdminUserCoins({ userId: adjusting.id, amount, reason, countAsPrize });
            });
            if (ok) setAdjusting(null);
          }}
        />
      ) : null}
    </section>
  );
}

function AdjustCoinsModal({
  user,
  busy,
  onClose,
  onSubmit,
}: {
  user: AdminUserRow;
  busy: boolean;
  onClose: () => void;
  onSubmit: (amount: number, reason: string, countAsPrize: boolean) => Promise<void>;
}) {
  const [amount, setAmount] = useState("50");
  const [reason, setReason] = useState("");
  const [countAsPrize, setCountAsPrize] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed === 0) {
      setFormError("El monto tiene que ser un entero distinto de 0.");
      return;
    }
    if (reason.trim().length < 8) {
      setFormError("El motivo necesita al menos 8 caracteres.");
      return;
    }
    setFormError(null);
    await onSubmit(parsed, reason.trim(), countAsPrize);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3 rounded-3xl border border-white/10 bg-neutral-950 p-5">
        <h3 className="text-lg font-black text-white">Ajuste de Coins</h3>
        <p className="text-sm text-neutral-400">
          {user.nickname || user.email} · saldo actual {user.balance} Coins
        </p>
        <input
          type="number"
          step={1}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={inputClass}
          placeholder="50 o -10"
        />
        <p className="text-xs text-neutral-500">Positivo acredita, negativo descuenta. El saldo no puede quedar bajo 0.</p>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={`${inputClass} min-h-24`}
          placeholder="Motivo (conflicto, premio mal cerrado, etc.)"
        />
        <label className="flex items-start gap-2 text-sm text-neutral-300">
          <input type="checkbox" checked={countAsPrize} onChange={(event) => setCountAsPrize(event.target.checked)} className="mt-1" />
          Contar en ranking (Coins ganadas)
        </label>
        {formError && <p className="text-sm text-red-300">{formError}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
            {busy ? "Guardando..." : "Confirmar ajuste"}
          </button>
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-neutral-200">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2.5 text-white outline-none";
