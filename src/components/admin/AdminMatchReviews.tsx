"use client";

import { useEffect, useState } from "react";
import { Loader2, Swords } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";
import {
  adminVoidMatchRoom,
  approveMatchResult,
  getAdminMatchReviews,
  playersOnTeam,
  rejectMatchResult,
  resolveMatchRoom,
  roomCapacity,
  roomStatusLabel,
  roomStatusTone,
  type MatchRoom,
  type RoomTeam,
} from "@/lib/rooms-db";

export function AdminMatchReviews() {
  const [rooms, setRooms] = useState<MatchRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    setRooms(await getAdminMatchReviews());
  };

  useEffect(() => {
    let active = true;
    reload()
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "No se pudieron cargar las salas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const run = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await reload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo completar la acción.");
    } finally {
      setBusyId(null);
    }
  };

  const openRooms = rooms.filter((room) => {
    if (room.status === "pending_review" || room.status === "disputed") return true;
    return room.status === "in_progress" && room.players.length === roomCapacity(room.mode);
  });
  const others = rooms.filter((room) => !openRooms.some((item) => item.id === room.id)).slice(0, 8);

  return (
    <section className="rounded-3xl border border-white/10 bg-neutral-900/85 p-5">
      <div>
        <h2 className="text-xl font-black text-white">Resultados y conflictos</h2>
        <p className="mt-1 text-xs text-neutral-500">
          El premio se paga acá. Revisá las capturas, aprobá un reclamo o elegí el equipo ganador. Si el match no se jugó,
          anulá y se reembolsa a todos.
        </p>
      </div>

      {error && <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-neutral-400">
          <Loader2 className="size-4 animate-spin" /> Cargando reclamos...
        </p>
      ) : openRooms.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No hay salas en revisión ni en conflicto.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {openRooms.map((room) => (
            <ReviewCard key={room.id} room={room} busy={busyId === room.id} onRun={run} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-500">Recientes</p>
          {others.map((room) => (
            <div key={room.id} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm">
              <p className="font-bold text-white">
                {room.mode} · {room.creatorName} · {room.prize} Coins
              </p>
              <StatusBadge tone={roomStatusTone(room.status)}>{roomStatusLabel(room.status)}</StatusBadge>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewCard({
  room,
  busy,
  onRun,
}: {
  room: MatchRoom;
  busy: boolean;
  onRun: (id: string, action: () => Promise<void>) => Promise<void>;
}) {
  const pending = room.results.filter((result) => result.status === "pending");

  return (
    <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-white">
            {room.mode} · {room.creatorName}
          </p>
          <p className="text-sm text-neutral-400">
            Entrada {room.entryFee} · pozo {room.prize} Coins
            {room.roomCode ? ` · código ${room.roomCode}` : ""}
          </p>
        </div>
        <StatusBadge tone={roomStatusTone(room.status)}>{roomStatusLabel(room.status)}</StatusBadge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <TeamPreview room={room} team="a" />
        <TeamPreview room={room} team="b" />
      </div>

      <div className="mt-3 space-y-3">
        {room.results.length === 0 ? (
          <p className="text-xs text-neutral-500">Todavía no hay capturas. Podés definir el ganador igual o anular.</p>
        ) : (
          room.results.map((result) => {
            const player = room.players.find((item) => item.userId === result.submittedBy);
            return (
              <div key={result.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {player?.nickname || "Jugador"} reclama equipo {result.claimedWinnerTeam.toUpperCase()}
                    </p>
                    {result.notes ? <p className="mt-1 text-xs text-neutral-500">{result.notes}</p> : null}
                  </div>
                  <StatusBadge tone={result.status === "approved" ? "emerald" : result.status === "rejected" ? "red" : "yellow"}>
                    {result.status}
                  </StatusBadge>
                </div>
                {result.evidenceUrl ? (
                  <a href={result.evidenceUrl} target="_blank" rel="noreferrer" className="mt-2 block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={result.evidenceUrl} alt="Captura del resultado" className="max-h-48 w-full rounded-lg object-contain bg-black" />
                  </a>
                ) : null}
                {result.status === "pending" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onRun(room.id, () => approveMatchResult(result.id))}
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-60"
                    >
                      Usar este resultado y pagar
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onRun(room.id, () => rejectMatchResult(result.id))}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-bold text-neutral-200 disabled:opacity-60"
                    >
                      Rechazar captura
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onRun(room.id, () => resolveMatchRoom(room.id, "a"))}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-700 py-2 text-xs font-black text-white disabled:opacity-60"
        >
          <Swords className="size-3.5" /> Ganó A y pagar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onRun(room.id, () => resolveMatchRoom(room.id, "b"))}
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-700 py-2 text-xs font-black text-white disabled:opacity-60"
        >
          <Swords className="size-3.5" /> Ganó B y pagar
        </button>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => onRun(room.id, () => adminVoidMatchRoom(room.id))}
        className="mt-2 w-full rounded-xl border border-red-500/30 py-2 text-xs font-bold text-red-200 disabled:opacity-60"
      >
        Anular y reembolsar a todos
      </button>
      {pending.length > 1 && room.status === "disputed" ? (
        <p className="mt-2 text-[11px] text-red-200">Hay {pending.length} reclamos pendientes en conflicto.</p>
      ) : null}
    </article>
  );
}

function TeamPreview({ room, team }: { room: MatchRoom; team: RoomTeam }) {
  const members = playersOnTeam(room, team);
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Equipo {team.toUpperCase()}</p>
      <ul className="mt-1 space-y-0.5">
        {members.map((player) => (
          <li key={player.id} className="truncate text-xs font-bold text-white">
            {player.nickname}
          </li>
        ))}
      </ul>
    </div>
  );
}
