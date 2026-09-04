"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Search } from "lucide-react";

import { fetchAndSyncPlayerFreeFireStats } from "@/app/actions/free-fire";
import { FreeFireStatsPreview } from "@/components/profile/FreeFireStatsPreview";
import { getFreeFireErrorMessage } from "@/lib/free-fire/messages";
import { getFreeFireAvatarUrl, type CommunityPlayerInfo, type CommunityPlayerStats } from "@/lib/free-fire/providers/community-api-provider";
import { persistFreeFireSnapshot } from "@/lib/player-stats";
import { FREE_FIRE_REGIONS, normalizeFreeFireRegion, type FreeFireRegionCode } from "@/lib/free-fire/regions";
import { cn } from "@/lib/utils";

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; info: CommunityPlayerInfo; stats: CommunityPlayerStats | null }
  | { status: "error"; message: string };

type FreeFireUidLookupProps = {
  uid: string;
  region: string;
  userId?: string;
  persistOnLoad?: boolean;
  onUidChange: (uid: string) => void;
  onRegionChange: (region: string) => void;
  onPlayerLoaded?: (info: CommunityPlayerInfo, stats: CommunityPlayerStats | null) => void;
  inputClassName?: string;
  autoLookup?: boolean;
  preview?: "nickname" | "stats";
};

export function FreeFireUidLookup({
  uid,
  region,
  userId,
  persistOnLoad = true,
  onUidChange,
  onRegionChange,
  onPlayerLoaded,
  inputClassName,
  autoLookup = false,
  preview = "stats",
}: FreeFireUidLookupProps) {
  const [lookupState, setLookupState] = useState<LookupState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  const loading = lookupState.status === "loading" || isPending;

  const handleLookup = () => {
    const trimmedUid = uid.trim();
    const normalizedRegion = normalizeFreeFireRegion(region);

    if (!trimmedUid) {
      setLookupState({ status: "error", message: "Ingresá un UID para consultar." });
      return;
    }

    setLookupState({ status: "loading" });

    startTransition(async () => {
      const result = await fetchAndSyncPlayerFreeFireStats(trimmedUid, normalizedRegion);

      if (!result.ok) {
        setLookupState({
          status: "error",
          message: getFreeFireErrorMessage(result.errorCode, result.message),
        });
        return;
      }

      if (persistOnLoad && userId) {
        const persist = await persistFreeFireSnapshot({
          userId,
          uid: trimmedUid,
          region: normalizedRegion,
          info: result.info,
          stats: result.stats,
          avatarUrl: getFreeFireAvatarUrl(result.info.avatarId),
        });

        if (!persist.ok) {
          setLookupState({
            status: "error",
            message: `Stats consultadas, pero no se pudieron guardar: ${persist.message}`,
          });
          onPlayerLoaded?.(result.info, result.stats);
          return;
        }
      }

      setLookupState({
        status: "ready",
        info: result.info,
        stats: result.stats,
      });
      onPlayerLoaded?.(result.info, result.stats);
    });
  };

  const handleUidBlur = () => {
    if (autoLookup && uid.trim()) {
      handleLookup();
    }
  };

  const fieldClass = cn("arena-input block min-w-0 w-full", inputClassName);

  return (
    <div className="@container relative z-10 space-y-4">
      <div className="grid min-w-0 grid-cols-1 gap-3">
        <label htmlFor="freefire-uid" className="block min-w-0 space-y-1.5">
          <span className="block text-sm font-medium text-neutral-300">UID Free Fire</span>
          <input
            id="freefire-uid"
            name="freefire_uid"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={uid}
            onChange={(event) => {
              onUidChange(event.target.value);
              if (lookupState.status !== "idle") {
                setLookupState({ status: "idle" });
              }
            }}
            onBlur={handleUidBlur}
            placeholder="Ej: 665951869"
            className={fieldClass}
          />
        </label>

        <div className="flex min-w-0 flex-col gap-3 @min-[22rem]:flex-row @min-[22rem]:items-end">
          <label htmlFor="freefire-region" className="block min-w-0 flex-1 space-y-1.5">
            <span className="block text-sm font-medium text-neutral-300">Región</span>
            <select
              id="freefire-region"
              name="freefire_region"
              value={normalizeFreeFireRegion(region)}
              onChange={(event) => {
                onRegionChange(event.target.value as FreeFireRegionCode);
                if (lookupState.status !== "idle") {
                  setLookupState({ status: "idle" });
                }
              }}
              className={cn(fieldClass, "h-11")}
            >
              {FREE_FIRE_REGIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleLookup}
            disabled={loading || !uid.trim()}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60 @min-[22rem]:w-auto"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Consultando..." : preview === "nickname" ? "Verificar UID" : "Consultar stats"}
          </button>
        </div>
      </div>

      {lookupState.status === "error" && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{lookupState.message}</p>
      )}

      {lookupState.status === "ready" && preview === "nickname" && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
            <CheckCircle2 className="size-4" />
            UID verificado
          </p>
          <p className="mt-2 font-heading text-xl font-bold text-white">
            {lookupState.info.nickname?.trim() || "Jugador sin nickname"}
          </p>
          <p className="mt-1 text-sm leading-6 text-neutral-400">
            Este nickname se va a asociar a tu cuenta. Si no es el tuyo, cambiá el UID y volvé a verificar.
          </p>
        </div>
      )}

      {lookupState.status === "ready" && preview === "stats" && (
        <FreeFireStatsPreview info={lookupState.info} stats={lookupState.stats} region={normalizeFreeFireRegion(region)} />
      )}
    </div>
  );
}
