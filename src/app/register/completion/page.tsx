"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getProfileUid } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

export default function RegisterCompletionPage() {
  return (
    <AuthenticatedLayout requireCompleteProfile={false}>
      {(auth) => <RegisterCompletionForm auth={auth} />}
    </AuthenticatedLayout>
  );
}

function RegisterCompletionForm({ auth }: { auth: AuthenticatedProfile }) {
  const [freefireUid, setFreefireUid] = useState(auth.profile?.freefire_uid ? getProfileUid(auth.profile) : "");
  const [freefireRegion, setFreefireRegion] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(auth.profile?.avatar_url ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleComplete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const basePayload = {
      id: auth.user.id,
      email: auth.profile?.email || auth.user.email || null,
      provider: auth.profile?.provider || "email",
      nickname: auth.profile?.nickname || auth.user.email?.split("@")[0] || "Jugador",
      freefire_uid: freefireUid.trim(),
      avatar_url: avatarUrl.trim() || null,
      status: auth.profile?.status || "active",
      created_at: auth.profile?.created_at || new Date().toISOString(),
    };

    const payloadWithRegion = {
      ...basePayload,
      freefire_region: freefireRegion.trim() || null,
    };

    let update = await supabase.from("profiles").upsert([payloadWithRegion], { onConflict: "id" });

    if (update.error && mentionsMissingRegionColumn(update.error.message)) {
      update = await supabase.from("profiles").upsert([basePayload], { onConflict: "id" });
    }

    if (update.error) {
      setError(update.error.message);
      setLoading(false);
      return;
    }

    setMessage("Perfil completado. Te estamos llevando al dashboard.");
    window.setTimeout(() => router.push("/dashboard"), 700);
  };

  return (
    <AuthFormWrapper title="Completar perfil" subtitle="Terminá de preparar tu cuenta para entrar a la arena">
      <form onSubmit={handleComplete} className="space-y-4">
        {message && (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {message}
          </p>
        )}
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">UID Free Fire</span>
          <input
            type="text"
            value={freefireUid}
            onChange={(event) => setFreefireUid(event.target.value)}
            required
            placeholder="Ej: 234567890"
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Región Free Fire</span>
          <input
            type="text"
            value={freefireRegion}
            onChange={(event) => setFreefireRegion(event.target.value)}
            placeholder="Ej: BR, LATAM, US"
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Avatar URL</span>
          <input
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          {loading ? "Completando..." : "Completar perfil"}
        </button>
      </form>
    </AuthFormWrapper>
  );
}

function mentionsMissingRegionColumn(message: string) {
  return message.includes("freefire_region") || message.includes("column") || message.includes("schema cache");
}
