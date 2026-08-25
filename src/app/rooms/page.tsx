"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Swords, UsersRound, X } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import type { AuthenticatedProfile } from "@/lib/profile";
import {
  cancelMatchRoom,
  createMatchRoom,
  getActiveRooms,
  joinMatchRoom,
  leaveMatchRoom,
  playersOnTeam,
  ROOM_ENTRY_FEES,
  ROOM_MODES,
  roomCapacity,
  roomStatusLabel,
  roomStatusTone,
  roomTeamPrize,
  roomTeamSize,
  submitMatchResult,
  type MatchRoom,
  type RoomMode,
  type RoomTeam,
} from "@/lib/rooms-db";
import { assertPlayableFreeFireAccount } from "@/lib/free-fire/guard";
import { MATCH_EVIDENCE_BUCKET, uploadUserImage } from "@/lib/storage-uploads";
import { getOrCreateWallet } from "@/lib/wallet";
import { subscribeRealtime } from "@/lib/realtime";

export default function RoomsPage() {
  return (
    <AuthenticatedLayout>
      {(auth) => (
        <AppLayout auth={auth}>
          <RoomsContent auth={auth} />
        </AppLayout>
      )}
    </AuthenticatedLayout>
  );
}

function RoomsContent({ auth }: { auth: AuthenticatedProfile }) {
  const [rooms, setRooms] = useState<MatchRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<RoomMode>("1v1");
  const [entryFee, setEntryFee] = useState<number>(10);
  const [roomCode, setRoomCode] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  const reload = async () => {
    const [nextRooms, wallet] = await Promise.all([getActiveRooms(), getOrCreateWallet(auth.user.id)]);
    setRooms(nextRooms);
    setBalance(wallet.balance);
  };

  useEffect(() => {
    let active = true;
    Promise.all([getActiveRooms(), getOrCreateWallet(auth.user.id)])
      .then(([nextRooms, wallet]) => {
        if (!active) return;
        setRooms(nextRooms);
        setBalance(wallet.balance);
        setLoading(false);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "No pudimos cargar las salas.");
        setLoading(false);
      });
    const unsubscribe = subscribeRealtime("rooms-board", ["match_rooms", "match_room_players", "match_results"], () => {
      if (!active) return;
      void reload().catch(() => {});
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth.user.id]);

  const flash = (ok: string) => {
    setSuccess(ok);
    setError(null);
    window.setTimeout(() => setSuccess(null), 4000);
  };

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await assertPlayableFreeFireAccount(auth.profile?.freefire_uid);
      await createMatchRoom(mode, entryFee, roomCode.trim());
      await reload();
      setModalOpen(false);
      setRoomCode("");
      flash("Sala creada. Estás en el equipo A. Se debitó la entrada.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No pudimos crear la sala.");
    } finally {
      setCreating(false);
    }
  };

  const runRoomAction = async (roomId: string, action: () => Promise<void>, okMessage: string) => {
    setBusyId(roomId);
    setError(null);
    try {
      await action();
      await reload();
      flash(okMessage);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo completar la acción.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-neutral-900/85 p-6 shadow-2xl md:flex-row md:items-center md:p-8">
        <div>
          <StatusBadge tone="emerald">Salas privadas</StatusBadge>
          <h1 className="mt-3 text-3xl font-black text-white md:text-4xl">Matchmaking 1v1 / 2v2 / 3v3 / 4v4</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            Cada jugador paga la entrada. La sala arranca cuando se llenan los dos equipos. Al terminar, subí la captura del
            resultado: un admin revisa y paga el 90% del pozo al equipo ganador.
          </p>
          <p className="mt-3 text-sm font-bold text-orange-200">Tu saldo: {balance == null ? "..." : `${balance} Coins`}</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white"
        >
          <Plus className="size-4" />
          Crear sala
        </button>
      </section>

      {success && <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200">{success}</p>}
      {error && <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-3 rounded-3xl border border-white/10 p-6 text-neutral-300">
          <Loader2 className="size-5 animate-spin text-orange-300" />
          Cargando salas...
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-8 text-center">
          <UsersRound className="mx-auto size-8 text-orange-300" />
          <p className="mt-3 font-bold text-white">No hay salas todavía</p>
          <p className="mt-1 text-sm text-neutral-500">Creá la primera con tu saldo de Coins.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              userId={auth.user.id}
              busy={busyId === room.id}
              onJoin={(team) =>
                runRoomAction(
                  room.id,
                  async () => {
                    await assertPlayableFreeFireAccount(auth.profile?.freefire_uid);
                    await joinMatchRoom(room.id, team);
                  },
                  "Entraste a la sala. Se debitó la entrada.",
                )
              }
              onLeave={() => runRoomAction(room.id, () => leaveMatchRoom(room.id), "Saliste de la sala. Te devolvimos la entrada.")}
              onCancel={() => runRoomAction(room.id, () => cancelMatchRoom(room.id), "Sala cancelada. Se reembolsó a todos.")}
              onSubmitResult={(team, file, notes) =>
                runRoomAction(
                  room.id,
                  async () => {
                    const uploaded = await uploadUserImage(MATCH_EVIDENCE_BUCKET, [auth.user.id, room.id], file);
                    await submitMatchResult(room.id, team, uploaded.url, notes);
                  },
                  "Captura enviada. Un admin revisa el resultado y paga el premio.",
                )
              }
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form onSubmit={handleCreateRoom} className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-neutral-900 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Nueva sala</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-neutral-400">
                <X className="size-4" />
              </button>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="text-neutral-300">Modalidad</span>
              <select value={mode} onChange={(event) => setMode(event.target.value as RoomMode)} className={inputClass}>
                {ROOM_MODES.map((item) => (
                  <option key={item} value={item}>
                    {item.replace("v", " vs ")} · {roomCapacity(item)} jugadores
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-neutral-300">Entrada (Coins)</span>
              <div className="grid grid-cols-4 gap-2">
                {ROOM_ENTRY_FEES.map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    onClick={() => setEntryFee(fee)}
                    className={`rounded-xl border py-2 text-sm font-black ${
                      entryFee === fee ? "border-orange-500 bg-orange-500/10 text-white" : "border-white/10 text-neutral-300"
                    }`}
                  >
                    {fee}
                  </button>
                ))}
              </div>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-neutral-300">Código Free Fire (opcional)</span>
              <input value={roomCode} onChange={(event) => setRoomCode(event.target.value)} placeholder="FF-12345" className={inputClass} />
            </label>
            <p className="text-xs text-neutral-500">
              Pozo del equipo ganador: {roomTeamPrize(entryFee, mode)} Coins ({roomTeamSize(mode)} jugadores ×{" "}
              {Math.floor(roomTeamPrize(entryFee, mode) / roomTeamSize(mode))} c/u, casa 10%).
            </p>
            <button type="submit" disabled={creating} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-black text-white disabled:opacity-60">
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}
              {creating ? "Creando..." : "Crear y debitar entrada"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none focus:border-orange-400";

function RoomCard({
  room,
  userId,
  busy,
  onJoin,
  onLeave,
  onCancel,
  onSubmitResult,
}: {
  room: MatchRoom;
  userId: string;
  busy: boolean;
  onJoin: (team: RoomTeam) => void;
  onLeave: () => void;
  onCancel: () => void;
  onSubmitResult: (team: RoomTeam, file: File, notes: string) => void;
}) {
  const isCreator = room.creatorId === userId;
  const isParticipant = room.players.some((player) => player.userId === userId);
  const teamSize = roomTeamSize(room.mode);
  const filled = room.players.length;
  const capacity = roomCapacity(room.mode);
  const share = teamSize > 0 ? Math.floor(room.prize / teamSize) : 0;
  const canSubmit =
    isParticipant && (room.status === "in_progress" || room.status === "pending_review" || room.status === "disputed");

  return (
    <article className="rounded-3xl border border-white/10 bg-neutral-900/90 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            {room.mode} · {filled}/{capacity}
          </p>
          <h2 className="mt-1 text-xl font-black text-white">{room.creatorName}</h2>
        </div>
        <StatusBadge tone={roomStatusTone(room.status)}>{roomStatusLabel(room.status)}</StatusBadge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-neutral-500">Entrada</p>
          <p className="font-bold text-white">{room.entryFee} Coins</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-neutral-500">Pozo equipo</p>
          <p className="font-bold text-orange-200">{room.prize} Coins</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-neutral-500">~{share} Coins por ganador</p>
      {room.roomCode && <p className="mt-2 text-xs text-neutral-400">Código: {room.roomCode}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <TeamColumn room={room} team="a" teamSize={teamSize} userId={userId} busy={busy} onJoin={onJoin} />
        <TeamColumn room={room} team="b" teamSize={teamSize} userId={userId} busy={busy} onJoin={onJoin} />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {room.status === "waiting" && isCreator && (
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border border-white/15 py-2 text-sm font-bold text-neutral-200 disabled:opacity-60">
            Cancelar y reembolsar a todos
          </button>
        )}
        {room.status === "waiting" && isParticipant && !isCreator && (
          <button type="button" disabled={busy} onClick={onLeave} className="rounded-xl border border-white/15 py-2 text-sm font-bold text-neutral-200 disabled:opacity-60">
            Salir y recuperar entrada
          </button>
        )}
        {room.results.length > 0 && <ResultClaims room={room} />}
        {canSubmit && <ResultSubmitForm busy={busy} onSubmit={onSubmitResult} existing={room.results.find((item) => item.submittedBy === userId)} />}
      </div>
    </article>
  );
}

function ResultClaims({ room }: { room: MatchRoom }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Reclamos</p>
      <ul className="mt-2 space-y-1">
        {room.results.map((result) => {
          const player = room.players.find((item) => item.userId === result.submittedBy);
          return (
            <li key={result.id} className="flex items-center justify-between gap-2 text-xs text-neutral-300">
              <span>
                {player?.nickname || "Jugador"} · equipo {result.claimedWinnerTeam.toUpperCase()}
              </span>
              <StatusBadge tone={result.status === "approved" ? "emerald" : result.status === "rejected" ? "red" : "yellow"}>
                {result.status === "pending" ? "pendiente" : result.status}
              </StatusBadge>
            </li>
          );
        })}
      </ul>
      {room.status === "disputed" && (
        <p className="mt-2 text-[11px] font-bold text-red-200">Hay reclamos cruzados. Un admin decide el ganador.</p>
      )}
      {room.status === "pending_review" && (
        <p className="mt-2 text-[11px] text-yellow-100">Esperando revisión admin. El premio no se paga solo.</p>
      )}
    </div>
  );
}

function ResultSubmitForm({
  busy,
  onSubmit,
  existing,
}: {
  busy: boolean;
  onSubmit: (team: RoomTeam, file: File, notes: string) => void;
  existing?: { claimedWinnerTeam: RoomTeam };
}) {
  const [team, setTeam] = useState<RoomTeam>(existing?.claimedWinnerTeam || "a");
  const [notes, setNotes] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("evidence") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    onSubmit(team, file, notes);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-orange-200">
        {existing ? "Actualizar captura" : "Enviar resultado"}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(["a", "b"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTeam(value)}
            className={`rounded-lg border py-1.5 text-[11px] font-black ${
              team === value ? "border-orange-500 bg-orange-500/15 text-white" : "border-white/10 text-neutral-400"
            }`}
          >
            Ganó {value.toUpperCase()}
          </button>
        ))}
      </div>
      <input
        required
        name="evidence"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="block w-full text-[11px] text-neutral-400 file:mr-2 file:rounded-lg file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-white"
      />
      <input
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Nota opcional"
        className="w-full rounded-lg border border-white/10 bg-neutral-950 px-2 py-1.5 text-xs text-white outline-none"
      />
      <button type="submit" disabled={busy} className="w-full rounded-lg bg-orange-600 py-2 text-[11px] font-black text-white disabled:opacity-60">
        {busy ? "Enviando..." : "Subir captura a revisión"}
      </button>
    </form>
  );
}

function TeamColumn({
  room,
  team,
  teamSize,
  userId,
  busy,
  onJoin,
}: {
  room: MatchRoom;
  team: RoomTeam;
  teamSize: number;
  userId: string;
  busy: boolean;
  onJoin: (team: RoomTeam) => void;
}) {
  const members = playersOnTeam(room, team);
  const emptySlots = Math.max(0, teamSize - members.length);
  const isParticipant = room.players.some((player) => player.userId === userId);
  const canJoin = room.status === "waiting" && !isParticipant && emptySlots > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
        Equipo {team.toUpperCase()} · {members.length}/{teamSize}
      </p>
      <ul className="mt-2 space-y-1">
        {members.map((player) => (
          <li key={player.id} className={`truncate text-xs font-bold ${player.userId === userId ? "text-orange-200" : "text-white"}`}>
            {player.nickname}
            {player.userId === userId ? " · vos" : ""}
          </li>
        ))}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <li key={`empty-${team}-${index}`} className="text-xs text-neutral-600">
            Cupo libre
          </li>
        ))}
      </ul>
      {canJoin && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onJoin(team)}
          className="mt-3 w-full rounded-lg bg-orange-600 py-1.5 text-[11px] font-black text-white disabled:opacity-60"
        >
          Unirme
        </button>
      )}
    </div>
  );
}
