"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { BadgeCheck, Loader2, Save, ShieldCheck } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { StatusBadge } from "@/components/presentation/StatusBadge";
import { GamingShell } from "@/components/GamingShell";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getInitials, getProfileEmail, getProfileName, getProfileStatus } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20";

export default function ProfilePage() {
  return (
    <AuthenticatedLayout requireCompleteProfile={false}>
      {(auth) => <ProfileContent auth={auth} />}
    </AuthenticatedLayout>
  );
}

function ProfileContent({ auth }: { auth: AuthenticatedProfile }) {
  const [nickname, setNickname] = useState(getProfileName(auth.profile, auth.user));
  const [freefireUid, setFreefireUid] = useState(auth.profile?.freefire_uid || "");
  const [avatarUrl, setAvatarUrl] = useState(auth.profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const email = getProfileEmail(auth.profile, auth.user);
  const status = getProfileStatus(auth.profile);
  const initials = getInitials(nickname) || "P";
  const visibleFreefireUid = freefireUid.trim() || "Pendiente";

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        nickname: nickname.trim(),
        freefire_uid: freefireUid.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", auth.user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess("Perfil actualizado correctamente.");
    setSaving(false);
  };

  return (
    <GamingShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-lg border border-white/10 bg-neutral-900/85 p-6 shadow-2xl shadow-black/25">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-28 items-center justify-center overflow-hidden rounded-lg border border-orange-400/30 bg-gradient-to-br from-orange-500/35 via-cyan-500/20 to-emerald-500/20 text-4xl font-black text-white shadow-xl shadow-orange-950/30">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={nickname} className="size-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <StatusBadge tone={status === "active" ? "emerald" : "red"} className="mt-5">
                {status}
              </StatusBadge>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white">{nickname}</h1>
              <p className="mt-1 text-sm text-neutral-400">{email}</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Free Fire UID</p>
                <p className="mt-1 font-bold text-white">{visibleFreefireUid}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Provider</p>
                <p className="mt-1 font-bold text-cyan-100">{auth.profile?.provider || "email"}</p>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <section className="rounded-lg border border-white/10 bg-neutral-900/85 p-6 shadow-2xl shadow-black/25">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <StatusBadge tone="cyan">Perfil Free Fire</StatusBadge>
                  <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Identidad del jugador</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">
                    Datos reales leídos desde Supabase. El UID Free Fire activa el perfil competitivo.
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-100">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <BadgeCheck className="size-4" />
                    {freefireUid ? "UID vinculado" : "UID pendiente"}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="mt-6 grid gap-4">
                {success && (
                  <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    {success}
                  </p>
                )}
                {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-neutral-300">Nickname</span>
                  <input value={nickname} onChange={(event) => setNickname(event.target.value)} required className={inputClass} />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-neutral-300">UID Free Fire</span>
                  <input
                    value={freefireUid}
                    onChange={(event) => setFreefireUid(event.target.value)}
                    placeholder="Ej: 234567890"
                    className={inputClass}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-sm font-medium text-neutral-300">Avatar URL</span>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-500 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </form>
            </section>

            <section className="rounded-lg border border-white/10 bg-neutral-900/85 p-6 shadow-2xl shadow-black/25">
              <div className="flex items-start gap-4">
                <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-emerald-200">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Estado competitivo</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    {freefireUid
                      ? "Tu UID está guardado en Supabase y listo para futuras integraciones."
                      : "Agregá tu UID para activar el perfil competitivo."}
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
