import type { EmailOtpType } from "@supabase/supabase-js";

import { parseAuthRedirect } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

function asOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null;
  return OTP_TYPES.includes(value as EmailOtpType) ? (value as EmailOtpType) : null;
}

function isPkceError(message: string | null | undefined) {
  return Boolean(message && /pkce|code verifier|code challenge/i.test(message));
}

export function translateAuthError(message: string | null | undefined, fallback = "No pudimos completar la operación.") {
  if (!message) return fallback;
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login") || normalized.includes("invalid credentials")) {
    return "Email o contraseña incorrectos.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Confirmá el email antes de ingresar. Revisá tu correo.";
  }
  if (normalized.includes("already registered") || normalized.includes("user already")) {
    return "Ese email ya tiene cuenta. Ingresá o recuperá la contraseña.";
  }
  if (normalized.includes("password should be") || normalized.includes("password is known to be") || normalized.includes("weak password")) {
    return "La contraseña es demasiado débil. Usá al menos 6 caracteres.";
  }
  if (normalized.includes("unable to validate email") || normalized.includes("invalid email")) {
    return "Ese email no es válido.";
  }
  if (normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit") || normalized.includes("too many requests")) {
    return "Demasiados intentos. Esperá un minuto y volvé a probar.";
  }
  if (normalized.includes("user not found")) {
    return "No hay una cuenta con ese email.";
  }
  if (normalized.includes("same password") || normalized.includes("should be different from the old password")) {
    return "La contraseña nueva tiene que ser distinta a la anterior.";
  }
  if (normalized.includes("new password should be different")) {
    return "La contraseña nueva tiene que ser distinta a la anterior.";
  }
  if (normalized.includes("session") && (normalized.includes("missing") || normalized.includes("expired"))) {
    return "La sesión expiró. Pedí un enlace nuevo.";
  }
  if (isPkceError(message)) {
    return recoveryLinkErrorMessage(message);
  }
  return message;
}

export function recoveryLinkErrorMessage(message?: string | null) {
  if (isPkceError(message)) {
    return "El enlace se abrió en otro navegador o ya se usó. Pedí uno nuevo y abrilo en esta misma pestaña, o ingresá el código de 6 dígitos del correo.";
  }
  return message || "El enlace de recuperación no es válido o expiró.";
}

async function sessionExists() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}

export async function establishSessionFromAuthUrl(href: string) {
  const { code, tokenHash, type, error, accessToken, refreshToken } = parseAuthRedirect(href);
  const otpType = asOtpType(type) || (tokenHash ? "recovery" : null);
  const recovery = otpType === "recovery" || type === "recovery";

  if (error) {
    return { error: recoveryLinkErrorMessage(error), recovery: recovery || isPkceError(error) };
  }

  if (tokenHash && otpType) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    return {
      error: otpError?.message ?? null,
      recovery: otpType === "recovery",
    };
  }

  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return { error: sessionError?.message ?? null, recovery };
  }

  if (await sessionExists()) {
    return { error: null, recovery };
  }

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return { error: null, recovery };
    }

    if (await sessionExists()) {
      return { error: null, recovery };
    }

    return {
      error: recoveryLinkErrorMessage(exchangeError.message),
      recovery: recovery || isPkceError(exchangeError.message),
    };
  }

  return { error: null, recovery };
}

export async function verifyRecoveryCode(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: "recovery",
  });
  return { error: error?.message ?? null };
}
