"use client";

import { useState } from "react";
import { BadgeCheck, Coins, Crosshair, Edit3, Gamepad2, Save, ShieldCheck, Trophy } from "lucide-react";

import { StatCard } from "@/components/presentation/StatCard";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { GamingShell } from "@/components/GamingShell";
import { playerProfile, playerStats } from "@/lib/presentation-data";

const statIcons = [Gamepad2, Trophy, Crosshair, Coins];
const statTones = ["orange", "emerald", "red", "yellow"] as const;

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(playerProfile.nickname);
  const [freeFireUid, setFreeFireUid] = useState(playerProfile.freeFireUid);

  return (
    <GamingShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-lg border border-white/10 bg-neutral-900/85 p-6 shadow-2xl shadow-black/25">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-28 items-center justify-center rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-500/35 via-cyan-500/20 to-emerald-500/20 text-4xl font-black text-white shadow-xl shadow-orange-950/30">
                {playerProfile.avatarInitials}
              </div>
              <StatusBadge tone="emerald" className="mt-5">
                {playerProfile.status}
              </StatusBadge>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white">{nickname}</h1>
              <p className="mt-1 text-sm text-neutral-400">{playerProfile.email}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Free Fire UID</p>
                <p className="mt-1 font-bold text-white">{freeFireUid}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Rango actual</p>
                <p className="mt-1 font-bold text-cyan-100">{playerProfile.tier}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing((value) => !value)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-black text-neutral-950 transition hover:bg-orange-100"
            >
              {isEditing ? <Save className="size-4" /> : <Edit3 className="size-4" />}
              {isEditing ? "Guardar cambios" : "Editar perfil"}
            </button>
          </aside>

          <div className="space-y-5">
            <section className="rounded-lg border border-white/10 bg-neutral-900/85 p-6 shadow-2xl shadow-black/25">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <StatusBadge tone="cyan">Perfil Free Fire</StatusBadge>
                  <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Identidad del jugador</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                    Gestioná avatar, UID, estado de cuenta y estadísticas del jugador desde una vista clara y competitiva.
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-100">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <BadgeCheck className="size-4" />
                    Verificado
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-neutral-300">Nickname</span>
                    <input
                      value={nickname}
                      onChange={(event) => setNickname(event.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none transition focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-neutral-300">UID Free Fire</span>
                    <input
                      value={freeFireUid}
                      onChange={(event) => setFreeFireUid(event.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </label>
                </div>
              )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              {playerStats.map((stat, index) => (
                <StatCard
                  key={stat.label}
                  icon={statIcons[index]}
                  label={stat.label}
                  value={stat.value}
                  meta={stat.meta}
                  tone={statTones[index]}
                />
              ))}
            </section>

            <section className="rounded-lg border border-white/10 bg-neutral-900/85 p-6 shadow-2xl shadow-black/25">
              <div className="flex items-start gap-4">
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-200">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Verificación Free Fire UID</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    UID validado visualmente para habilitar inscripción en desafíos y salas privadas. En producción esta card debería conectarse a la validación real del backend.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </GamingShell>
  );
}
