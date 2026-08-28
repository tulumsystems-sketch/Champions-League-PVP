"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2 } from "lucide-react";

import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("No hay una sesión de recuperación activa. Esta pantalla queda lista para el flujo real de Supabase.");
      return;
    }

    setSuccess("Contraseña actualizada correctamente. Ya podés iniciar sesión.");
  };

  return (
    <AuthFormWrapper title="Nueva contraseña" subtitle="Definí una contraseña segura para volver a la arena">
      <form onSubmit={handleReset} className="space-y-4">
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {success && (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {success}
          </p>
        )}

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Nueva contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            placeholder="Mínimo 6 caracteres"
            className="arena-input"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Confirmar contraseña</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={6}
            required
            placeholder="Repetí la contraseña"
            className="arena-input"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="arena-btn w-full disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
          {loading ? "Guardando..." : "Guardar contraseña"}
        </button>

        <Link href="/login" className="block text-center text-sm font-medium text-neutral-400 transition hover:text-white">
          Volver al inicio de sesión
        </Link>
      </form>
    </AuthFormWrapper>
  );
}
