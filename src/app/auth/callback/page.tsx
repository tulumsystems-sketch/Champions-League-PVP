"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { GamingShell } from "@/components/GamingShell";
import { isProfileComplete, PROFILE_SELECT } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const finish = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const next = url.searchParams.get("next") || "/dashboard";

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (active) setError(exchangeError.message);
          return;
        }
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const email = user.email || null;
      const nickname =
        String(user.user_metadata?.full_name || user.user_metadata?.name || "")
          .trim() || email?.split("@")[0] || "Jugador";
      const provider = user.app_metadata?.provider === "google" ? "google" : user.app_metadata?.provider || "google";

      const { data: existing } = await supabase.from("profiles").select(PROFILE_SELECT).eq("id", user.id).maybeSingle();

      if (!existing) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          [
            {
              id: user.id,
              email,
              provider,
              nickname,
              status: "active",
              created_at: new Date().toISOString(),
            },
          ],
          { onConflict: "id" },
        );
        if (profileError && active) {
          setError(profileError.message);
          return;
        }
      }

      const { data: profile } = await supabase.from("profiles").select(PROFILE_SELECT).eq("id", user.id).maybeSingle();
      if (!isProfileComplete(profile)) {
        router.replace("/register/completion");
        return;
      }

      router.replace(next.startsWith("/") ? next : "/dashboard");
    };

    finish().catch((unknownError) => {
      if (active) {
        setError(unknownError instanceof Error ? unknownError.message : "No pudimos completar el acceso con Google.");
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (error) {
    return (
      <GamingShell>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-10">
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-6 text-center">
            <ShieldAlert className="mx-auto size-8 text-red-200" />
            <h1 className="mt-4 text-xl font-black text-white">No pudimos entrar con Google</h1>
            <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
            <Link href="/login" className="mt-5 inline-block text-sm font-bold text-orange-300">
              Volver al login
            </Link>
          </div>
        </div>
      </GamingShell>
    );
  }

  return (
    <GamingShell>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10 text-white">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/80 px-4 py-3">
          <Loader2 className="size-5 animate-spin text-orange-200" />
          <span className="text-sm font-semibold text-neutral-200">Completando acceso...</span>
        </div>
      </div>
    </GamingShell>
  );
}
