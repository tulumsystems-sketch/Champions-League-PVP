"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { CountUp } from "@/components/motion/CountUp";
import { motionDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function CoinChip({
  balance,
  className,
}: {
  balance: number | null;
  className?: string;
}) {
  const glowRef = useRef<HTMLSpanElement>(null);
  const discRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = glowRef.current;
    const disc = discRef.current;
    if (!node || balance == null) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        node,
        { opacity: 0.9, scale: 0.6 },
        { opacity: 0, scale: 1.8, duration: motionDuration(0.7), ease: "power2.out" },
      );
      if (disc) {
        gsap.fromTo(disc, { rotateY: 0 }, { rotateY: 360, duration: motionDuration(0.7), ease: "power2.out" });
      }
    }, node.parentElement || node);
    return () => ctx.revert();
  }, [balance]);

  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-amber-100",
        className,
      )}
    >
      <span ref={glowRef} className="pointer-events-none absolute inset-0 bg-amber-300/40 blur-md" />
      <span ref={discRef} className="coin-disc relative" />
      <span className="relative text-xs font-black tabular-nums">
        {balance == null ? "Wallet" : <CountUp value={balance} suffix=" Coins" />}
      </span>
    </span>
  );
}
