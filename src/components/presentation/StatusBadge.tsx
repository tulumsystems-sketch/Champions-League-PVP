import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusBadgeTone = "orange" | "cyan" | "emerald" | "yellow" | "red" | "neutral";

const toneClasses: Record<StatusBadgeTone, string> = {
  orange: "border-orange-400/35 bg-orange-500/10 text-orange-200 shadow-[0_0_18px_rgba(255,83,24,0.14)]",
  cyan: "border-cyan-400/35 bg-cyan-500/10 text-cyan-200 shadow-[0_0_18px_rgba(46,230,255,0.14)]",
  emerald: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
  yellow: "border-amber-400/35 bg-amber-500/10 text-amber-100",
  red: "border-red-400/35 bg-red-500/10 text-red-200",
  neutral: "border-white/15 bg-white/8 text-neutral-200",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        toneClasses[tone],
        className,
      )}
    >
      <span
        className={cn(
          "size-1 rounded-full",
          tone === "emerald" && "bg-emerald-300",
          tone === "cyan" && "bg-cyan-300",
          tone === "orange" && "bg-orange-300",
          tone === "yellow" && "bg-amber-300",
          tone === "red" && "bg-red-300",
          tone === "neutral" && "bg-neutral-400",
        )}
      />
      {children}
    </span>
  );
}
