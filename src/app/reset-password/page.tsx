"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";

import { RecoveryCodeForm } from "@/components/auth/RecoveryCodeForm";
import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { establishSessionFromAuthUrl, recoveryLinkErrorMessage, translateAuthError } from "@/lib/auth-recovery";
import { parseAuthRedirect, peekPasswordRecoveryEmail } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkHint, setLinkHint] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recoveryEmail, setRecoveryEmail] = useState("");

  useEffect(() => {
    let active = true;

    const finish = (options?: { hint?: string; code?: boolean }) => {
      if (!active) return;
      if (options?.hint) setLinkHint(options.hint);
      setNeedsCode(Boolean(options?.code));
      setCheckingLink(false);
    };

    const init = async () => {
      setRecoveryEmail(peekPasswordRecoveryEmail());
      const href = window.location.href;
      const { code, tokenHash, token, accessToken, error: redirectError } = parseAuthRedirect(href);

      if (redirectError) {
        finish({
          hint: "El enlace de recuperación no es válido. Si el correo trae un código de 6 dígitos, ingresalo acá.",
          code: true,
        });
        return;
      }

      if (code || tokenHash || accessToken) {
        const { error: exchangeError } = await establishSessionFromAuthUrl(href);
        window.history.replaceState({}, "", "/reset-password");
        if (exchangeError) {
          finish({
            hint: recoveryLinkErrorMessage(exchangeError),
            code: true,
          });
          return;
        }
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        finish({
          hint: token
            ? "Ingresá el código del correo para elegir una contraseña nueva."
            : "Si el enlace no abrió la sesión, ingresá el código de 6 dígitos del correo.",
          code: true,
        });
        return;
      }

      finish();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setLinkHint(null);
        setNeedsCode(false);
        setCheckingLink(false);
      }
    });

    init().catch(() => {
      finish({
        hint: "No pudimos validar el enlace. Probá con el código del correo.",
        code: true,
      });
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
      setError(translateAuthError(updateError.message, "No pudimos actualizar la contraseña. Pedí un enlace nuevo."));
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
          <Loader2 className="size-5 animate-spin text-arena" />
          Abriendo la sesión de recuperación...
        </div>
      </AuthFormWrapper>
    );
  }

  if (needsCode) {
    return (
      <AuthFormWrapper
        title="Ingresá el código"
        subtitle={linkHint || "Usá el código de 6 dígitos del correo para no volver a pedir el enlace."}
      >
        <RecoveryCodeForm
          defaultEmail={recoveryEmail}
          onVerified={() => {
            setNeedsCode(false);
            setLinkHint(null);
          }}
        />
        <Link href="/forgot-password" className="mt-4 block text-center text-sm font-medium text-arena transition hover:text-white">
          Pedir un correo nuevo
        </Link>
        <Link href="/login" className="mt-3 flex items-center justify-center gap-2 text-sm text-neutral-400 transition hover:text-white">
          <ArrowLeft className="size-4" />
          Volver al inicio de sesión
        </Link>
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
