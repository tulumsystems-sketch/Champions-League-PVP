"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";

import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <AuthFormWrapper title="Recuperar contraseña" subtitle="Te enviamos un enlace para volver a entrar a la plataforma.">
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
            <p className="text-sm font-bold text-emerald-200">Enlace enviado</p>
            <p className="mt-1 text-sm leading-6 text-neutral-400">
              Revisá <span className="font-semibold text-white">{email}</span> y seguí las instrucciones.
            </p>
          </div>
          <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-neutral-400 transition hover:text-white">
            <ArrowLeft className="size-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-neutral-300">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="tu@email.com"
              className="arena-input"
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="arena-btn w-full disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>

          <Link href="/login" className="flex items-center justify-center gap-2 pt-1 text-sm text-neutral-500 transition hover:text-white">
            <ArrowLeft className="size-4" />
            Volver al inicio de sesión
          </Link>
        </form>
      )}
    </AuthFormWrapper>
  );
}
