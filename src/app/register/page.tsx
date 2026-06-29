"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { supabase } from "@/lib/supabase";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-2.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-orange-400/60 focus:ring-2 focus:ring-orange-400/20";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          uid_freefire: uid,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // TODO: Replace this client-side insert with a server-side profile creation flow once RLS/schema are final.
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          full_name: name,
          uid_freefire: uid,
          email,
          coins: 0,
        },
      ]);

      if (profileError) {
        console.warn("Profile insert failed:", profileError.message);
      }
    }

    setSuccess("Registro exitoso. Revisá tu email para confirmar la cuenta.");
    setLoading(false);
    window.setTimeout(() => router.push("/login"), 900);
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/register/completion`,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setGoogleLoading(false);
    }
  };

  return (
    <AuthFormWrapper title="Crear cuenta" subtitle="Registrate y dejá listo tu perfil competitivo para la arena.">
      <form onSubmit={handleRegister} className="space-y-4">
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {success && (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {success}
          </p>
        )}

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">
            Nombre <span className="text-neutral-500">(en Free Fire)</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Tu nombre de jugador"
            className={inputClass}
          />
        </label>

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
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            className={inputClass}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">
            UID Free Fire <span className="text-neutral-500">(tu ID de jugador)</span>
          </span>
          <input
            type="text"
            value={uid}
            onChange={(event) => setUid(event.target.value)}
            required
            placeholder="Ej: 234567890"
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-500 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {loading ? "Registrando..." : "Crear cuenta"}
        </button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-neutral-900 px-2 text-neutral-500">o registrate con</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
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

        <p className="pt-1 text-center text-sm text-neutral-500">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-bold text-orange-300 transition hover:text-orange-200">
            Iniciá sesión
          </Link>
        </p>
      </form>
    </AuthFormWrapper>
  );
}
