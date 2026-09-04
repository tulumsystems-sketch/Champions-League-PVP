"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { motionDuration, prefersReducedMotion } from "@/lib/motion";
import {
  cleanPlayerCardName,
  formatCardStat,
  playerCardInitials,
  playerCardOverall,
  playerCardProgram,
  playerCardStars,
  playerCardTierFromLevel,
  resolvePlayerCardRank,
  type PlayerCardTier,
} from "@/lib/player-card";
import { cn } from "@/lib/utils";

import "./player-card.css";

export type PlayerUltimateCardModel = {
  name: string;
  avatarUrl?: string | null;
  initials?: string;
  uid?: string;
  region?: string | null;
  clan?: string | null;
  level?: number | null;
  rank?: number | null;
  rankingPoints?: number | null;
  likes?: number | null;
  kills?: number | null;
  wins?: number | null;
  headshots?: number | null;
  position?: string;
};

export function PlayerUltimateCard({
  player,
  size = "md",
  className,
}: {
  player: PlayerUltimateCardModel;
  size?: "sm" | "md";
  className?: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const rank = resolvePlayerCardRank(player.rank, player.rankingPoints);
  const tier = playerCardTierFromLevel(player.level);
  const overall = playerCardOverall({
    level: player.level,
    rankingPoints: player.rankingPoints,
    kills: player.kills,
    wins: player.wins,
  });
  const compact = size === "sm";
  const stars = playerCardStars(tier);
  const displayName = cleanPlayerCardName(player.name);
  const initials = player.initials?.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2) || playerCardInitials(player.name);
  const leftStats = [
    { key: "KIL", value: formatCardStat(player.kills) },
    { key: "WIN", value: formatCardStat(player.wins) },
    { key: "HDS", value: formatCardStat(player.headshots) },
  ];
  const rightStats = [
    { key: "LVL", value: formatCardStat(player.level) },
    { key: "PTS", value: formatCardStat(player.rankingPoints) },
    { key: "LIK", value: formatCardStat(player.likes) },
  ];

  useEffect(() => {
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        card,
        { rotateY: -16, rotateX: 8, y: 14 },
        { rotateY: 0, rotateX: 0, y: 0, duration: motionDuration(0.7), ease: "power3.out" },
      );
    }, stage);

    const tilt = (event: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      if (prefersReducedMotion()) return;
      gsap.to(card, {
        rotateY: (x - 0.5) * 14,
        rotateX: -(y - 0.5) * 8,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      });
    };
    const reset = () => {
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "18%");
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.45, ease: "power3.out" });
    };

    stage.addEventListener("mousemove", tilt);
    stage.addEventListener("mouseleave", reset);
    return () => {
      stage.removeEventListener("mousemove", tilt);
      stage.removeEventListener("mouseleave", reset);
      gsap.killTweensOf(card);
      ctx.revert();
    };
  }, [player.avatarUrl, player.name]);

  return (
    <div
      ref={stageRef}
      className={cn("fut-stage mx-auto select-none", compact ? "w-[168px]" : "w-[280px] sm:w-[300px]", className)}
    >
      <div ref={cardRef} className={cn("fut-card", compact && "fut-compact")}>
        <div className="fut-shell" data-tier={tier}>
          <div className="fut-rim">
            <div className="fut-face" data-tier={tier}>
              <div className="fut-fx">
                <div className="fut-pattern" />
                <div className="fut-holo" />
                <div className="fut-grain" />
                <div className="fut-spec" />
                <span className="fut-shine" />
              </div>

              <div className="fut-layout">
                <div className={cn("fut-banner", compact ? "py-0.5 text-[6px]" : "py-1 text-[9px]")}>
                  LV {formatCardStat(player.level)} · {playerCardProgram(tier)}
                </div>

                <div className="fut-upper">
                  <div className="fut-left">
                    <p className={cn("fut-ovr font-heading font-bold text-white", compact ? "text-[1.7rem]" : "text-5xl")}>
                      {overall}
                    </p>
                    <p className={cn("fut-pos", compact ? "text-[7px]" : "text-[11px]")}>{player.position || "FF"}</p>
                    <p className={cn("fut-rank-short", compact ? "text-[7px]" : "text-[10px]", tierInk(tier))}>
                      {rank.short}
                    </p>
                    {!compact ? <div className="fut-crest">CLP</div> : null}
                    <p className="fut-region">{(player.region || "br").toUpperCase()}</p>
                  </div>
                  <div className="fut-art">
                    <span className="fut-art-glow" />
                    {player.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.avatarUrl} alt="" />
                    ) : (
                      <div className={cn("fut-art-fallback font-heading", compact ? "text-lg" : "text-3xl")}>
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                <div className="fut-plate">
                  <div className="fut-stars" aria-hidden>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span key={index} data-on={index < stars} />
                    ))}
                  </div>
                  <p className={cn("fut-name font-heading", compact ? "text-[10px]" : "text-base")} title={displayName}>
                    {displayName}
                  </p>
                  <p className={cn("fut-rankline", tierInk(tier))}>
                    {rank.label}
                    {player.clan ? ` · ${player.clan}` : ""}
                  </p>
                </div>

                {!compact ? (
                  <>
                    <div className="fut-divider">
                      <span />
                      <span className="fut-diamond" />
                      <span />
                    </div>
                    <div className="fut-stats">
                      <div className="fut-stats-col">
                        {leftStats.map((stat) => (
                          <div key={stat.key} className="fut-stat">
                            <span className="fut-stat-key">{stat.key}</span>
                            <span className="fut-stat-val font-heading text-sm">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="fut-stats-rule" />
                      <div className="fut-stats-col">
                        {rightStats.map((stat) => (
                          <div key={stat.key} className="fut-stat">
                            <span className="fut-stat-key">{stat.key}</span>
                            <span className="fut-stat-val font-heading text-sm">{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="fut-compact-meta">
                    <span>LV {formatCardStat(player.level)}</span>
                    <span>{formatCardStat(player.rankingPoints)} PTS</span>
                  </div>
                )}

                {player.uid ? <p className="fut-uid">UID {player.uid}</p> : <span className="fut-uid" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function tierInk(tier: PlayerCardTier) {
  if (tier === "gold" || tier === "icon") return "text-amber-200";
  if (tier === "special") return "text-arena";
  if (tier === "purple" || tier === "rare") return "text-fuchsia-200";
  if (tier === "silver") return "text-slate-200";
  return "text-orange-200";
}
