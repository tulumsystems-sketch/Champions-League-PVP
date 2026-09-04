"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { CountUp } from "@/components/motion/CountUp";
import { motionDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";

type CombatStatTone = "kill" | "headshot" | "win" | "coin" | "neutral";

const tones: Record<CombatStatTone, { text: string; flash: string }> = {
  kill: { text: "text-arena", flash: "bg-arena" },
  headshot: { text: "text-white", flash: "bg-white" },
  win: { text: "text-emerald-300", flash: "bg-emerald-400" },
  coin: { text: "text-amber-300", flash: "bg-amber-400" },
  neutral: { text: "text-white", flash: "bg-white" },
};

export function CombatStat({
  label,
  value,
  tone = "neutral",
  className,
}: {
  label: string;
  value: number | string;
  tone?: CombatStatTone;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLSpanElement>(null);
  const slashRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLParagraphElement>(null);
  const numeric = typeof value === "number";
  const raw = numeric ? String(value) : String(value).replace(/[^\d.-]/g, "");
  const parsed = numeric ? value : raw === "" ? Number.NaN : Number(raw);
  const canCount = Number.isFinite(parsed);

  useEffect(() => {
    const root = rootRef.current;
    const node = flashRef.current;
    const slash = slashRef.current;
    const valueNode = valueRef.current;
    if (!root || !node) return;
    const ctx = gsap.context(() => {
      const d = motionDuration(0.55);
      gsap.fromTo(node, { scale: 0.35, opacity: 0.95 }, { scale: 1.9, opacity: 0, duration: d, ease: "power2.out" });
      gsap.fromTo(valueNode, { scale: 1.12, y: 4 }, { scale: 1, y: 0, duration: motionDuration(0.38), ease: "back.out(2)" });

      if (slash && (tone === "kill" || tone === "headshot")) {
        gsap.fromTo(
          slash,
          { scaleX: 0, opacity: 1, x: -10 },
          { scaleX: 1.15, opacity: 0, x: 16, duration: motionDuration(0.4), ease: "power3.out" },
        );
      }

      const bits = root.querySelectorAll("[data-spark]");
      if (bits.length && (tone === "kill" || tone === "headshot" || tone === "win")) {
        bits.forEach((bit, index) => {
          gsap.fromTo(
            bit,
            { x: 0, y: 0, scale: 1, opacity: 0.9 },
            {
              x: gsap.utils.random(-18, 22),
              y: gsap.utils.random(-22, -6),
              scale: 0,
              opacity: 0,
              duration: motionDuration(0.55),
              delay: index * 0.04,
              ease: "power2.out",
            },
          );
        });
      }
    }, root);
    return () => ctx.revert();
  }, [value, tone]);

  return (
    <div ref={rootRef} className={cn("arena-stat relative overflow-hidden", className)}>
      <span ref={flashRef} className={cn("pointer-events-none absolute right-3 top-3 size-8 rounded-full blur-md", tones[tone].flash)} />
      {tone === "kill" || tone === "headshot" ? (
        <span
          ref={slashRef}
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 h-[2px] w-11 origin-left -rotate-12",
            tone === "headshot" ? "bg-white/90" : "bg-arena/90",
          )}
        />
      ) : null}
      {tone === "kill" || tone === "headshot" || tone === "win"
        ? [0, 1, 2].map((index) => (
            <span
              key={index}
              data-spark
              className={cn(
                "pointer-events-none absolute right-6 top-5 size-1 rounded-full",
                tone === "win" ? "bg-emerald-300" : tone === "headshot" ? "bg-white" : "bg-arena",
              )}
            />
          ))
        : null}
      <p className="arena-kicker">{label}</p>
      <p ref={valueRef} className={cn("mt-2 font-heading text-2xl font-bold tracking-wide", tones[tone].text)}>
        {canCount ? (
          <>
            {!numeric && String(value).startsWith("#") ? "#" : null}
            <CountUp value={parsed} />
          </>
        ) : (
          value
        )}
      </p>
    </div>
  );
}
