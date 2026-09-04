"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";

import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { FreeFireUidLookup } from "@/components/profile/FreeFireUidLookup";
import { assertPlayableFreeFireAccount } from "@/lib/free-fire/guard";
import { getFreeFireAvatarUrl, type CommunityPlayerInfo } from "@/lib/free-fire/providers/community-api-provider";
import { normalizeFreeFireRegion } from "@/lib/free-fire/regions";
import { persistFreeFireSnapshot } from "@/lib/player-stats";
import { isDuplicateUidError } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const inputClass =
  "arena-input";

export default function RegisterPage() {
  const [freefireUid, setFreefireUid] = useState("");
  const [freefireRegion, setFreefireRegion] = useState("br");
  const [verifiedPlayer, setVerifiedPlayer] = useState<CommunityPlayerInfo | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    if (!freefireUid.trim() || !verifiedPlayer) {
      setError("Consultá tu UID de Free Fire y esperá la ficha del jugador antes de crear la cuenta.");
      setLoading(false);
      return;
    }

    try {
      await assertPlayableFreeFireAccount(freefireUid);
    } catch (uidError) {
      setError(uidError instanceof Error ? uidError.message : "Ese UID de Free Fire no se puede usar.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          freefire_uid: freefireUid.trim(),
          provider: "email",
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const nickname = verifiedPlayer.nickname?.trim() || email.split("@")[0];
      const { error: profileError } = await supabase.from("profiles").upsert(
        [
          {
            id: data.user.id,
            email,
            provider: "email",
            nickname,
            freefire_uid: freefireUid.trim(),
            freefire_region: normalizeFreeFireRegion(freefireRegion),
            avatar_url: getFreeFireAvatarUrl(verifiedPlayer.avatarId),
            status: "active",
            created_at: new Date().toISOString(),
          },
        ],
        { onConflict: "id" },
      );

      if (profileError) {
        setError(
          isDuplicateUidError(profileError.message)
            ? "Ese UID de Free Fire ya está vinculado a otra cuenta."
            : profileError.message,
        );
        setLoading(false);
        return;
      }

      try {
        await persistFreeFireSnapshot({
          userId: data.user.id,
          uid: freefireUid.trim(),
          region: normalizeFreeFireRegion(freefireRegion),
          info: verifiedPlayer,
          stats: null,
          avatarUrl: getFreeFireAvatarUrl(verifiedPlayer.avatarId),
        });
      } catch {
        // La cuenta ya está creada; las stats se pueden sincronizar después desde Perfil.
      }
    }

    setSuccess("Cuenta creada correctamente. Redirigiendo...");
    setLoading(false);
    window.setTimeout(() => router.push("/dashboard"), 700);
  };

  return (
    <AuthFormWrapper title="Crear cuenta" subtitle="Validamos tu UID de Free Fire y después entras con correo o Google.">
      <form onSubmit={handleRegister} className="space-y-4">
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {success && (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {success}
          </p>
        )}

        <GoogleAuthButton />
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">o con email</p>

        <FreeFireUidLookup
          uid={freefireUid}
          region={freefireRegion}
          persistOnLoad={false}
          onUidChange={(value) => {
            setFreefireUid(value);
            setVerifiedPlayer(null);
          }}
          onRegionChange={(value) => {
            setFreefireRegion(value);
            setVerifiedPlayer(null);
          }}
          onPlayerLoaded={(info) => setVerifiedPlayer(info)}
          inputClassName={inputClass}
          preview="nickname"
        />

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Correo</span>
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
          <span className="text-sm font-medium text-neutral-300">Repetir contraseña</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
            placeholder="Repetir contraseña"
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="arena-btn w-full disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
          {loading ? "Registrando..." : "Crear cuenta"}
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
