"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { supabase } from "@/lib/supabase";

export default function RegisterCompletionPage() {
  const [nickname, setNickname] = useState("");
  const [freeFireUid, setFreeFireUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleComplete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // TODO: Persist this data to the real profiles table once the Supabase schema is finalized.
      await supabase.auth.updateUser({
        data: {
          full_name: nickname,
          uid_freefire: freeFireUid,
        },
      });
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

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Nickname</span>
          <input
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            required
            placeholder="Tu nombre de jugador"
            className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Free Fire UID</span>
          <input
            type="text"
            value={freeFireUid}
            onChange={(event) => setFreeFireUid(event.target.value)}
            required
            placeholder="Ej: 234567890"
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
