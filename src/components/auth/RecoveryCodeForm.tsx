"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";

import { verifyRecoveryCode } from "@/lib/auth-recovery";
import { markPasswordRecoveryIntent } from "@/lib/site-url";

type RecoveryCodeFormProps = {
  defaultEmail?: string;
  onVerified: () => void;
};

export function RecoveryCodeForm({ defaultEmail = "", onVerified }: RecoveryCodeFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: verifyError } = await verifyRecoveryCode(email, token);
    if (verifyError) {
      setError("El código no es válido o expiró. Revisá el correo o pedí uno nuevo.");
      setLoading(false);
      return;
    }

    markPasswordRecoveryIntent(email);
    setLoading(false);
    onVerified();
  };

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      {error ? <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-neutral-300">Correo electrónico</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          placeholder="tu@email.com"
          className="arena-input"
        />
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-neutral-300">Código de 6 dígitos</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          value={token}
          onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 8))}
          required
          minLength={6}
          placeholder="123456"
          className="arena-input tracking-[0.3em]"
        />
      </label>

      <button type="submit" disabled={loading} className="arena-btn w-full disabled:opacity-60">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {loading ? "Validando..." : "Continuar con el código"}
      </button>
    </form>
  );
}
