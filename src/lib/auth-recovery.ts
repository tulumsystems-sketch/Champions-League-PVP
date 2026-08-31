import type { EmailOtpType } from "@supabase/supabase-js";

import { parseAuthRedirect } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

function asOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null;
  return OTP_TYPES.includes(value as EmailOtpType) ? (value as EmailOtpType) : null;
}

export async function establishSessionFromAuthUrl(href: string) {
  const { code, tokenHash, type, error } = parseAuthRedirect(href);
  if (error) {
    return { error, recovery: type === "recovery" };
  }

  const otpType = asOtpType(type) || (tokenHash ? "recovery" : null);

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

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    return { error: exchangeError?.message ?? null, recovery: type === "recovery" };
  }

  return { error: null, recovery: type === "recovery" };
}
