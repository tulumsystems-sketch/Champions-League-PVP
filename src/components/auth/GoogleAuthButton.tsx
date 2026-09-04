"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { getAuthRedirectUrl } from "@/lib/site-url";
import { translateAuthError } from "@/lib/auth-recovery";
import { supabase } from "@/lib/supabase";

type GoogleAuthButtonProps = {
  nextPath?: string;
};

export function GoogleAuthButton({ nextPath = "/dashboard" }: GoogleAuthButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    const fromQuery =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("redirectTo")
        : null;
    const destination = fromQuery || nextPath;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(destination),
        queryParams: { access_type: "offline", prompt: "select_account" },
      },
    });

    if (oauthError) {
      const message = oauthError.message.toLowerCase();
      setError(
        message.includes("provider is not enabled") || message.includes("unsupported provider")
          ? "Google todavía no está habilitado. Hay que cargar Client ID y Secret en Supabase Auth."
          : translateAuthError(oauthError.message),
      );
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={handleGoogle}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white px-4 py-2.5 text-sm font-black text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
        {busy ? "Redirigiendo..." : "Continuar con Google"}
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.2 2.8-2.5 3.7v3h4c2.4-2.2 3.5-5.4 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-4-3c-1.1.7-2.4 1.2-3.9 1.2-3 0-5.5-2-6.4-4.7H1.5v3.1C3.5 21.4 7.5 24 12 24z" />
      <path fill="#FBBC05" d="M5.6 14.6c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.3H1.5C.5 9.2 0 10.6 0 12.5s.5 3.3 1.5 5.2l4.1-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.5 0 3.5 2.6 1.5 6.5l4.1 3.1C6.5 6.8 9 4.8 12 4.8z" />
    </svg>
  );
}
