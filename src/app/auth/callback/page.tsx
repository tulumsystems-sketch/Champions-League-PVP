"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { RecoveryCodeForm } from "@/components/auth/RecoveryCodeForm";
import { GamingShell } from "@/components/GamingShell";
import { ensurePlayerProfile, isProfileComplete } from "@/lib/profile";
import { establishSessionFromAuthUrl, recoveryLinkErrorMessage } from "@/lib/auth-recovery";
import {
  consumePasswordRecoveryIntent,
  isPasswordRecoveryRedirect,
  parseAuthRedirect,
  peekPasswordRecoveryEmail,
  RESET_PASSWORD_PATH,
} from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);

  useEffect(() => {
    let active = true;
    let recoveryEvent = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") recoveryEvent = true;
    });

    const finish = async () => {
      const href = window.location.href;
      const { next, tokenHash } = parseAuthRedirect(href);
      const recoveryIntent = consumePasswordRecoveryIntent();
      const fromUrl = await establishSessionFromAuthUrl(href);
      const looksLikeRecovery =
        fromUrl.recovery || recoveryEvent || isPasswordRecoveryRedirect(href, recoveryIntent);

      if (fromUrl.error) {
        if (!active) return;
        if (looksLikeRecovery) {
          router.replace(RESET_PASSWORD_PATH);
          return;
        }
        setError(recoveryLinkErrorMessage(fromUrl.error));
        return;
      }

      if (!tokenHash && !fromUrl.recovery) {
        await new Promise((resolve) => window.setTimeout(resolve, 400));
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (looksLikeRecovery) {
          router.replace(RESET_PASSWORD_PATH);
          return;
        }
        router.replace("/login");
        return;
      }

      if (looksLikeRecovery) {
        router.replace(RESET_PASSWORD_PATH);
        return;
      }

      const profile = await ensurePlayerProfile(user);
      if (!isProfileComplete(profile)) {
        router.replace("/register/completion");
        return;
      }

      router.replace(next.startsWith("/") ? next : "/dashboard");
    };

    finish().catch((unknownError) => {
      if (active) {
        setError(unknownError instanceof Error ? unknownError.message : "No pudimos completar el acceso.");
        setShowRecoveryCode(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (error) {
    return (
      <GamingShell>
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-10">
          <div className="arena-panel w-full p-6 text-center">
            <ShieldAlert className="mx-auto size-8 text-red-200" />
            <h1 className="mt-4 text-xl font-black text-white">No pudimos completar el acceso</h1>
            <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
            {showRecoveryCode ? (
              <div className="mt-5 text-left">
                <RecoveryCodeForm
                  defaultEmail={peekPasswordRecoveryEmail()}
                  onVerified={() => router.replace(RESET_PASSWORD_PATH)}
                />
              </div>
            ) : null}
            <div className="mt-5 flex justify-center gap-4">
              <Link href="/login" className="text-sm font-bold text-neutral-300">
                Volver al login
              </Link>
            </div>
          </div>
        </div>
      </GamingShell>
    );
  }

  return (
    <GamingShell>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10 text-white">
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/80 px-4 py-3">
          <Loader2 className="size-5 animate-spin text-arena" />
          <span className="text-sm font-semibold text-neutral-200">Completando acceso...</span>
        </div>
      </div>
    </GamingShell>
  );
}
