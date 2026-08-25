"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Trophy } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";
import {
  cancelChallenge,
  CHALLENGE_METRICS,
  challengePrizeLabel,
  closeChallenge,
  createChallenge,
  DEFAULT_CHALLENGE_PRIZES,
  getAdminChallenges,
  getChallengeEnrollmentCounts,
  getChallengeStandings,
  previewChallengePrizes,
  updateChallenge,
  type Challenge,
  type ChallengeStanding,
} from "@/lib/challenges";
import { metricLabel } from "@/lib/player-stats";

export function AdminChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Challenge | "new" | null>(null);
  const [closing, setClosing] = useState<Challenge | null>(null);

  const reload = async () => {
    const [nextChallenges, nextCounts] = await Promise.all([getAdminChallenges(), getChallengeEnrollmentCounts()]);
    setChallenges(nextChallenges);
    setCounts(nextCounts);
  };

  useEffect(() => {
    let active = true;
    reload()
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar los desafíos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-neutral-900/85 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Desafíos</h2>
          <p className="mt-1 text-xs text-neutral-500">Premios fijos que cargás al crear el desafío (ejemplo del PRD: 50 / 30 / 10 Coins). Métrica por defecto: Puntos. Menos de 2 inscriptos se reembolsa.</p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white">
          <Plus className="size-4" /> Nuevo
        </button>
      </div>

      {error && <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="size-4 animate-spin" /> Cargando desafíos...
        </p>
      ) : challenges.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">Todavía no hay desafíos.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {challenges.map((challenge) => (
            <article key={challenge.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-white">{challenge.title}</p>
                  <p className="text-sm text-neutral-400">
                    {metricLabel(challenge.metric)} · entrada {challenge.entry_fee} · {challengePrizeLabel(challenge)} · {counts[challenge.id] || 0} inscriptos
                  </p>
                </div>
                <StatusBadge tone={challenge.status === "active" ? "emerald" : challenge.status === "completed" ? "cyan" : challenge.status === "cancelled" ? "red" : "orange"}>
                  {challenge.status}
                </StatusBadge>
              </div>
              {challenge.status !== "completed" && challenge.status !== "cancelled" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setEditing(challenge)} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-neutral-200">
                    Editar
                  </button>
                  <button type="button" onClick={() => setClosing(challenge)} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">
                    Cerrar y pagar
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm("¿Cancelar y reembolsar entradas?")) return;
                      setError(null);
                      try {
                        await cancelChallenge(challenge.id);
                        await reload();
                      } catch (actionError) {
                        setError(actionError instanceof Error ? actionError.message : "No se pudo cancelar.");
                      }
                    }}
                    className="rounded-xl border border-red-500/30 px-3 py-2 text-xs font-bold text-red-200"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {editing && (
        <ChallengeForm
          challenge={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
      {closing && (
        <CloseChallengeModal
          challenge={closing}
          enrolled={counts[closing.id] || 0}
          onClose={() => setClosing(null)}
          onDone={async () => {
            setClosing(null);
            await reload();
          }}
        />
      )}
    </section>
  );
}

function ChallengeForm({
  challenge,
  onClose,
  onSaved,
}: {
  challenge: Challenge | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(challenge?.title || "");
  const [description, setDescription] = useState(challenge?.description || "");
  const [metric, setMetric] = useState(challenge?.metric || "points");
  const [entryFee, setEntryFee] = useState(String(challenge?.entry_fee ?? 10));
  const [prizeFirst, setPrizeFirst] = useState(String(challenge?.prizeFirst ?? DEFAULT_CHALLENGE_PRIZES.first));
  const [prizeSecond, setPrizeSecond] = useState(String(challenge?.prizeSecond ?? DEFAULT_CHALLENGE_PRIZES.second));
  const [prizeThird, setPrizeThird] = useState(String(challenge?.prizeThird ?? DEFAULT_CHALLENGE_PRIZES.third));
  const [maxPlayers, setMaxPlayers] = useState(challenge?.max_players ? String(challenge.max_players) : "");
  const [status, setStatus] = useState<"active" | "upcoming">((challenge?.status === "upcoming" ? "upcoming" : "active") as "active" | "upcoming");
  const [startDate, setStartDate] = useState(toLocalInput(challenge?.start_date));
  const [endDate, setEndDate] = useState(toLocalInput(challenge?.end_date));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title,
      description,
      metric,
      entryFee: Number(entryFee) || 0,
      prizeFirst: Number(prizeFirst) || 0,
      prizeSecond: Number(prizeSecond) || 0,
      prizeThird: Number(prizeThird) || 0,
      startDate: fromLocalInput(startDate),
      endDate: fromLocalInput(endDate),
      maxPlayers: maxPlayers.trim() ? Number(maxPlayers) : null,
      status,
    };
    try {
      if (challenge) await updateChallenge(challenge.id, payload);
      else await createChallenge(payload);
      await onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-neutral-900 p-6">
        <h3 className="text-xl font-black text-white">{challenge ? "Editar desafío" : "Nuevo desafío"}</h3>
        <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Título" className={inputClass} />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descripción" className={`${inputClass} min-h-20`} />
        <select value={metric} onChange={(event) => setMetric(event.target.value)} className={inputClass}>
          {CHALLENGE_METRICS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input type="number" min={0} value={entryFee} onChange={(event) => setEntryFee(event.target.value)} placeholder="Entrada Coins" className={inputClass} />
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs text-neutral-400">
            1° Coins
            <input type="number" min={0} value={prizeFirst} onChange={(event) => setPrizeFirst(event.target.value)} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs text-neutral-400">
            2° Coins
            <input type="number" min={0} value={prizeSecond} onChange={(event) => setPrizeSecond(event.target.value)} className={`${inputClass} mt-1`} />
          </label>
          <label className="text-xs text-neutral-400">
            3° Coins
            <input type="number" min={0} value={prizeThird} onChange={(event) => setPrizeThird(event.target.value)} className={`${inputClass} mt-1`} />
          </label>
        </div>
        <input type="number" min={2} value={maxPlayers} onChange={(event) => setMaxPlayers(event.target.value)} placeholder="Cupo (vacío = sin límite)" className={inputClass} />
        <select value={status} onChange={(event) => setStatus(event.target.value as "active" | "upcoming")} className={inputClass}>
          <option value="active">Activo (se puede inscribir)</option>
          <option value="upcoming">Próximamente</option>
        </select>
        <label className="block text-xs text-neutral-400">
          Inicio
          <input required type="datetime-local" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-xs text-neutral-400">
          Cierre
          <input required type="datetime-local" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`${inputClass} mt-1`} />
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-neutral-300">
            Cerrar
          </button>
        </div>
      </form>
    </div>
  );
}

function CloseChallengeModal({
  challenge,
  enrolled,
  onClose,
  onDone,
}: {
  challenge: Challenge;
  enrolled: number;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [standings, setStandings] = useState<ChallengeStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = previewChallengePrizes(enrolled, {
    first: challenge.prizeFirst,
    second: challenge.prizeSecond,
    third: challenge.prizeThird,
  });
  const collected = enrolled * challenge.entry_fee;

  useEffect(() => {
    getChallengeStandings(challenge.id)
      .then(setStandings)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "No se pudo leer la tabla."))
      .finally(() => setLoading(false));
  }, [challenge.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-neutral-900 p-6">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-orange-300" />
          <h3 className="text-xl font-black text-white">Cerrar {challenge.title}</h3>
        </div>
        {preview.cancelled ? (
          <p className="mt-3 text-sm text-amber-200">Hay menos de 2 inscriptos. Se reembolsan las entradas y el desafío queda cancelado.</p>
        ) : (
          <p className="mt-3 text-sm text-neutral-300">
            Premios a pagar: <strong className="text-white">{preview.pot} Coins</strong> ({challengePrizeLabel(challenge)}).
            Entradas recaudadas: <strong className="text-white">{collected} Coins</strong>
            {collected < preview.pot ? ". Ojo: se pagan más Coins de las que entran." : "."}
          </p>
        )}
        {loading ? (
          <p className="mt-4 text-sm text-neutral-400">Cargando posiciones...</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {standings.map((row, index) => (
              <li key={row.participantId} className="flex justify-between rounded-xl border border-white/10 px-3 py-2">
                <span className="text-white">
                  #{row.position} {row.nickname} · {row.score}
                </span>
                <span className="font-black text-orange-200">
                  {typeof preview.shares[index] === "number" ? `${preview.shares[index]} Coins` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await closeChallenge(challenge.id);
                await onDone();
              } catch (closeError) {
                setError(closeError instanceof Error ? closeError.message : "No se pudo cerrar.");
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
          >
            {busy ? "Pagando..." : preview.cancelled ? "Reembolsar y cancelar" : "Confirmar y acreditar premios"}
          </button>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-neutral-300">
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none";

function toLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}
