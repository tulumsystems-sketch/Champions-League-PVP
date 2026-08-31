"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Loader2, ShieldAlert } from "lucide-react";

import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { parseAuthRedirect } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const finish = (message?: string) => {
      if (!active) return;
      if (message) setLinkError(message);
      setCheckingLink(false);
    };

    const init = async () => {
      const { code, error: redirectError } = parseAuthRedirect(window.location.href);

      if (redirectError) {
        finish("El enlace de recuperación no es válido. Pedí uno nuevo.");
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", "/reset-password");
        if (exchangeError) {
          finish("El enlace expiró o ya fue usado. Pedí uno nuevo desde recuperar contraseña.");
          return;
        }
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        finish("Este enlace no es válido o expiró. Pedí uno nuevo desde recuperar contraseña.");
        return;
      }

      finish();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setLinkError(null);
        setCheckingLink(false);
      }
    });

    init().catch(() => {
      finish("No pudimos validar el enlace de recuperación.");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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

    if (updateError) {
      setLoading(false);
      setError(updateError.message || "No pudimos actualizar la contraseña. Pedí un enlace nuevo.");
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    setSuccess("Contraseña actualizada. Ya podés iniciar sesión.");
    window.setTimeout(() => router.replace("/login"), 1600);
  };

  if (checkingLink) {
    return (
      <AuthFormWrapper title="Nueva contraseña" subtitle="Validando el enlace de recuperación...">
        <div className="flex items-center justify-center gap-3 py-6 text-sm text-neutral-300">
          <Loader2 className="size-5 animate-spin text-orange-200" />
          Abriendo la sesión de recuperación...
        </div>
      </AuthFormWrapper>
    );
  }

  if (linkError) {
    return (
      <AuthFormWrapper title="Enlace inválido" subtitle="El correo de recuperación caducó o ya no es válido.">
        <div className="space-y-4">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center">
            <ShieldAlert className="mx-auto size-6 text-red-200" />
            <p className="mt-3 text-sm leading-6 text-red-100/80">{linkError}</p>
          </div>
          <Link
            href="/forgot-password"
            className="arena-btn flex w-full items-center justify-center"
          >
            Pedir un enlace nuevo
          </Link>
          <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-neutral-400 transition hover:text-white">
            <ArrowLeft className="size-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      </AuthFormWrapper>
    );
  }

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
            autoComplete="new-password"
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
            autoComplete="new-password"
            placeholder="Repetí la contraseña"
            className="arena-input"
          />
        </label>

        <button
          type="submit"
          disabled={loading || Boolean(success)}
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
