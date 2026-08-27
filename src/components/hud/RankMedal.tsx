"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { motionDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function RankMedal({ place }: { place: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const tone =
    place === 1
      ? "from-amber-300 to-yellow-600 text-yellow-950 shadow-[0_0_16px_rgba(240,193,75,0.45)]"
      : place === 2
        ? "from-slate-200 to-slate-500 text-slate-900 shadow-[0_0_12px_rgba(203,213,225,0.28)]"
        : place === 3
          ? "from-amber-600 to-orange-900 text-amber-100 shadow-[0_0_12px_rgba(180,83,9,0.35)]"
          : "from-white/10 to-white/5 text-neutral-300";

  useEffect(() => {
    const node = ref.current;
    if (!node || place > 3) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        node,
        { scale: 0.4, rotate: -20, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, duration: motionDuration(0.45), ease: "back.out(1.8)" },
      );
    }, node);
    return () => ctx.revert();
  }, [place]);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md bg-gradient-to-br font-heading text-xs font-black",
        tone,
      )}
    >
      {place}
    </span>
  );
}
