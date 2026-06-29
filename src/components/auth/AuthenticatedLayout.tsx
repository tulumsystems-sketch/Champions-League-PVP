"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { GamingShell } from "@/components/GamingShell";
import { type AuthenticatedProfile, isProfileComplete, PROFILE_SELECT } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

type AuthState =
  | { status: "loading" }
  | { status: "ready"; context: AuthenticatedProfile }
  | { status: "error"; message: string };

type AuthenticatedLayoutProps = {
  children: (context: AuthenticatedProfile) => ReactNode;
  requireCompleteProfile?: boolean;
};

export function AuthenticatedLayout({ children, requireCompleteProfile = true }: AuthenticatedLayoutProps) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      setState({ status: "loading" });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        const redirectTo = encodeURIComponent(pathname || "/dashboard");
        router.replace(`/login?redirectTo=${redirectTo}`);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError) {
        setState({ status: "error", message: profileError.message });
        return;
      }

      if (requireCompleteProfile && !isProfileComplete(profile)) {
        const redirectTo = encodeURIComponent(pathname || "/dashboard");
        router.replace(`/register/completion?redirectTo=${redirectTo}`);
        return;
      }

      if (!requireCompleteProfile && isProfileComplete(profile) && pathname === "/register/completion") {
        const redirectTo = new URLSearchParams(window.location.search).get("redirectTo");
        router.replace(redirectTo || "/dashboard");
        return;
      }

      setState({ status: "ready", context: { user, profile } });
    };

    loadSession();

    return () => {
      active = false;
    };
  }, [pathname, requireCompleteProfile, router]);

  if (state.status === "ready") {
    return <>{children(state.context)}</>;
  }

  if (state.status === "error") {
    return (
      <GamingShell>
        <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center px-4 py-10">
          <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-6 text-center shadow-2xl shadow-black/30">
            <ShieldAlert className="mx-auto size-8 text-red-200" />
            <h1 className="mt-4 text-xl font-black text-white">No pudimos cargar tu perfil</h1>
            <p className="mt-2 text-sm leading-6 text-red-100/80">{state.message}</p>
          </div>
        </div>
      </GamingShell>
    );
  }

  return (
    <GamingShell>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10 text-white">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/80 px-4 py-3 shadow-2xl shadow-black/30">
          <Loader2 className="size-5 animate-spin text-orange-200" />
          <span className="text-sm font-semibold text-neutral-200">Cargando sesión...</span>
        </div>
      </div>
    </GamingShell>
  );
}
