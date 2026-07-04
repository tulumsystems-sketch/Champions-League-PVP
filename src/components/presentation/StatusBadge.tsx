import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusBadgeTone = "orange" | "cyan" | "emerald" | "yellow" | "red" | "neutral";

const toneClasses: Record<StatusBadgeTone, string> = {
  orange: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  cyan: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  emerald: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  yellow: "border-yellow-400/30 bg-yellow-500/10 text-yellow-100",
  red: "border-red-400/30 bg-red-500/10 text-red-200",
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
