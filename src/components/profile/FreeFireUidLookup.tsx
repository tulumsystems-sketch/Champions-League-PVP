"use client";

import { useState, useTransition } from "react";
import { Loader2, Search } from "lucide-react";

import { fetchAndSyncPlayerFreeFireStats } from "@/app/actions/free-fire";
import { FreeFireStatsPreview } from "@/components/profile/FreeFireStatsPreview";
import { getFreeFireErrorMessage } from "@/lib/free-fire/messages";
import { getFreeFireAvatarUrl, type CommunityPlayerInfo, type CommunityPlayerStats } from "@/lib/free-fire/providers/community-api-provider";
import { persistFreeFireSnapshot } from "@/lib/player-stats";
import { FREE_FIRE_REGIONS, normalizeFreeFireRegion, type FreeFireRegionCode } from "@/lib/free-fire/regions";

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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">UID Free Fire</span>
          <input
            value={uid}
            onChange={(event) => {
              onUidChange(event.target.value);
              if (lookupState.status !== "idle") {
                setLookupState({ status: "idle" });
              }
            }}
            onBlur={handleUidBlur}
            placeholder="Ej: 665951869"
            className={inputClassName}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-neutral-300">Región</span>
          <select
            value={normalizeFreeFireRegion(region)}
            onChange={(event) => {
              onRegionChange(event.target.value as FreeFireRegionCode);
              if (lookupState.status !== "idle") {
                setLookupState({ status: "idle" });
              }
            }}
            className={inputClassName}
          >
            {FREE_FIRE_REGIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleLookup}
            disabled={loading || !uid.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-500/20 disabled:opacity-60 md:w-auto"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Consultando..." : "Consultar stats"}
          </button>
        </div>
      </div>

      {lookupState.status === "error" && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{lookupState.message}</p>
      )}

      {lookupState.status === "ready" && (
        <FreeFireStatsPreview info={lookupState.info} stats={lookupState.stats} region={normalizeFreeFireRegion(region)} />
      )}
    </div>
  );
}
