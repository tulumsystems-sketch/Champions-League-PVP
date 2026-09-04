"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { RecoveryCodeForm } from "@/components/auth/RecoveryCodeForm";
import { GamingShell } from "@/components/GamingShell";
import { establishSessionFromAuthUrl, recoveryLinkErrorMessage } from "@/lib/auth-recovery";
import { parseAuthRedirect, peekPasswordRecoveryEmail, RESET_PASSWORD_PATH } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

export default function AuthConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showCodeForm, setShowCodeForm] = useState(false);

  useEffect(() => {
    let active = true;

    const finish = async () => {
      const href = window.location.href;
      const { next, type } = parseAuthRedirect(href);
      const fromUrl = await establishSessionFromAuthUrl(href);

      if (fromUrl.error) {
        if (!active) return;
        setError(recoveryLinkErrorMessage(fromUrl.error));
        setShowCodeForm(fromUrl.recovery || type === "recovery");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        if (!active) return;
        setError("No pudimos validar el enlace. Ingresá el código del correo o pedí uno nuevo.");
        setShowCodeForm(true);
        return;
      }

      const destination =
        fromUrl.recovery || type === "recovery"
          ? RESET_PASSWORD_PATH
          : next.startsWith("/")
            ? next
            : "/dashboard";
      router.replace(destination);
    };

    finish().catch(() => {
      if (active) {
        setError("No pudimos validar el enlace de recuperación.");
        setShowCodeForm(true);
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (error) {
    return (
      <GamingShell>
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4 py-10">
          <div className="arena-panel w-full p-6 text-center">
            <ShieldAlert className="mx-auto size-8 text-red-200" />
            <h1 className="mt-4 text-xl font-black text-white">No pudimos abrir el enlace</h1>
            <p className="mt-2 text-sm leading-6 text-red-100/80">{error}</p>
            {showCodeForm ? (
              <div className="mt-5 text-left">
                <RecoveryCodeForm
                  defaultEmail={peekPasswordRecoveryEmail()}
                  onVerified={() => router.replace(RESET_PASSWORD_PATH)}
                />
              </div>
            ) : null}
            <div className="mt-5 flex justify-center gap-4">
              <Link href="/forgot-password" className="text-sm font-bold text-arena">
                Pedir un correo nuevo
              </Link>
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
          <span className="text-sm font-semibold text-neutral-200">Validando el enlace...</span>
        </div>
      </div>
    </GamingShell>
  );
}
