"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { isProfileComplete, PROFILE_SELECT } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const inputClass =
  "arena-input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !data.user) {
      setError(loginError?.message || "No pudimos iniciar sesión.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const redirectTo = new URLSearchParams(window.location.search).get("redirectTo");
    router.push(isProfileComplete(profile) ? redirectTo || "/dashboard" : "/register/completion");
  };

  const nextPath = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirectTo") || "/dashboard" : "/dashboard";

  return (
    <AuthFormWrapper title="Iniciar sesión" subtitle="Ingresá a tu cuenta para competir, revisar Coins y ver rankings.">
      <form onSubmit={handleLogin} className="space-y-4">
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        <GoogleAuthButton nextPath={nextPath} />
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">o con email</p>

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
          className="arena-btn w-full disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          {loading ? "Ingresando..." : "Ingresar"}
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
