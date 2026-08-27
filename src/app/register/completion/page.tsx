"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

import { AuthenticatedLayout } from "@/components/auth/AuthenticatedLayout";
import { AuthFormWrapper } from "@/components/AuthFormWrapper";
import { FreeFireUidLookup } from "@/components/profile/FreeFireUidLookup";
import { assertPlayableFreeFireAccount } from "@/lib/free-fire/guard";
import type { CommunityPlayerInfo } from "@/lib/free-fire/providers/community-api-provider";
import { normalizeFreeFireRegion } from "@/lib/free-fire/regions";
import type { AuthenticatedProfile } from "@/lib/profile";
import { getProfileUid, isDuplicateUidError } from "@/lib/profile";
import { persistFreeFireSnapshot } from "@/lib/player-stats";
import { getFreeFireAvatarUrl } from "@/lib/free-fire/providers/community-api-provider";
import { supabase } from "@/lib/supabase";

export default function RegisterCompletionPage() {
  return (
    <AuthenticatedLayout requireCompleteProfile={false}>
      {(auth) => <RegisterCompletionForm auth={auth} />}
    </AuthenticatedLayout>
  );
}

function RegisterCompletionForm({ auth }: { auth: AuthenticatedProfile }) {
  const [freefireUid, setFreefireUid] = useState(auth.profile?.freefire_uid ? getProfileUid(auth.profile) : "");
  const [freefireRegion, setFreefireRegion] = useState(auth.profile?.freefire_region || "br");
  const [avatarUrl, setAvatarUrl] = useState(auth.profile?.avatar_url ?? "");
  const [verifiedPlayer, setVerifiedPlayer] = useState<CommunityPlayerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleComplete = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (!freefireUid.trim() || !verifiedPlayer) {
      setError("Consultá tu UID de Free Fire y esperá la ficha del jugador antes de continuar.");
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

    const resolvedNickname = verifiedPlayer.nickname?.trim() || auth.profile?.nickname || auth.user.email?.split("@")[0] || "Jugador";

    const basePayload = {
      id: auth.user.id,
      email: auth.profile?.email || auth.user.email || null,
      provider: auth.profile?.provider || "email",
      nickname: resolvedNickname,
      freefire_uid: freefireUid.trim(),
      avatar_url: avatarUrl.trim() || null,
      status: auth.profile?.status || "active",
      created_at: auth.profile?.created_at || new Date().toISOString(),
    };

    const payloadWithRegion = {
      ...basePayload,
      freefire_region: normalizeFreeFireRegion(freefireRegion),
      freefire_level: verifiedPlayer?.level ?? auth.profile?.freefire_level ?? 0,
      freefire_likes: verifiedPlayer?.liked ?? auth.profile?.freefire_likes ?? 0,
      freefire_rank: verifiedPlayer?.rank ?? auth.profile?.freefire_rank ?? 0,
      clan_name: verifiedPlayer?.clanName ?? auth.profile?.clan_name ?? null,
      signature: verifiedPlayer?.signature ?? auth.profile?.signature ?? null,
    };

    let update = await supabase.from("profiles").upsert([payloadWithRegion], { onConflict: "id" });

    if (update.error && mentionsMissingRegionColumn(update.error.message)) {
      update = await supabase.from("profiles").upsert([basePayload], { onConflict: "id" });
    }

    if (update.error) {
      setError(
        isDuplicateUidError(update.error.message)
          ? "Ese UID de Free Fire ya está vinculado a otra cuenta."
          : update.error.message,
      );
      setLoading(false);
      return;
    }

    if (verifiedPlayer) {
      await persistFreeFireSnapshot({
        userId: auth.user.id,
        uid: freefireUid.trim(),
        region: normalizeFreeFireRegion(freefireRegion),
        info: verifiedPlayer,
        stats: null,
        avatarUrl: getFreeFireAvatarUrl(verifiedPlayer.avatarId),
      });
    }

    setMessage("Perfil completado. Te estamos llevando al dashboard.");
    window.setTimeout(() => router.push("/dashboard"), 700);
  };

  return (
    <AuthFormWrapper title="Completar perfil" subtitle="Terminá de preparar tu cuenta para entrar a la arena">
      <form onSubmit={handleComplete} className="space-y-4">
        {message && (
          <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            {message}
          </p>
        )}
        {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

        <FreeFireUidLookup
          uid={freefireUid}
          region={freefireRegion}
          userId={auth.user.id}
          onUidChange={(value) => {
            setFreefireUid(value);
            setVerifiedPlayer(null);
          }}
          onRegionChange={(value) => {
            setFreefireRegion(value);
            setVerifiedPlayer(null);
          }}
          onPlayerLoaded={(info) => {
            setVerifiedPlayer(info);
            const avatar = getFreeFireAvatarUrl(info.avatarId);
            if (avatar) setAvatarUrl(avatar);
          }}
          inputClassName="arena-input"
        />

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Avatar URL</span>
          <input
            type="url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
            className="arena-input"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="arena-btn w-full disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
          {loading ? "Completando..." : "Completar perfil"}
        </button>
      </form>
    </AuthFormWrapper>
  );
}

function mentionsMissingRegionColumn(message: string) {
  return message.includes("freefire_region") || message.includes("column") || message.includes("schema cache");
}
