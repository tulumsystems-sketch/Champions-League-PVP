"use client";

import { useEffect, useRef } from "react";
import { Swords } from "lucide-react";
import gsap from "gsap";

import { motionDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function BrandMark({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const box = size === "lg" ? "size-14" : size === "sm" ? "size-8" : "size-10";
  const icon = size === "lg" ? "size-7" : size === "sm" ? "size-3.5" : "size-5";

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        node,
        { rotate: -16, scale: 0.72, opacity: 0 },
        { rotate: 0, scale: 1, opacity: 1, duration: motionDuration(0.55), ease: "back.out(1.7)" },
      );
    }, node);
    return () => ctx.revert();
  }, []);

  return (
    <span
      ref={ref}
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-[#ff3b52] via-[#ff1638] to-[#9b0018] text-white shadow-[0_0_28px_rgba(255,22,56,0.42)]",
        box,
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-[1px] rounded-[10px] border border-white/20" />
      <Swords className={icon} />
    </span>
  );
}
