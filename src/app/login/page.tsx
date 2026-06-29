"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { supabase } from "@/lib/supabase";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setGoogleLoading(false);
    }
  };

  return (
    <AuthFormWrapper title="Iniciar sesión" subtitle="Ingresá a tu cuenta para competir, revisar Coins y ver rankings.">
      <form onSubmit={handleLogin} className="space-y-4">
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="tu@email.com"
            className={inputClass}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="••••••••"
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-neutral-900 px-2 text-neutral-500">o continuá con</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <span className="flex size-5 items-center justify-center rounded-full bg-white text-xs font-black text-neutral-950">G</span>
          )}
          {googleLoading ? "Conectando..." : "Continuar con Google"}
        </button>

        <div className="flex items-center justify-between gap-4 pt-1 text-sm">
          <Link href="/forgot-password" className="text-neutral-400 transition hover:text-white">
            ¿Olvidaste tu contraseña?
          </Link>
          <Link href="/register" className="font-bold text-orange-300 transition hover:text-orange-200">
            Crear cuenta
          </Link>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
