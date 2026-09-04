import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusBadgeTone = "orange" | "cyan" | "emerald" | "yellow" | "red" | "neutral";

const toneClasses: Record<StatusBadgeTone, string> = {
  orange: "border-arena/35 bg-arena/10 text-arena shadow-[0_0_18px_rgba(255,22,56,0.18)]",
  cyan: "border-white/15 bg-white/8 text-white/80",
  emerald: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200",
  yellow: "border-amber-400/35 bg-amber-500/10 text-amber-100",
  red: "border-arena/40 bg-arena/10 text-arena",
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
          tone === "cyan" && "bg-white",
          tone === "orange" && "bg-arena",
          tone === "yellow" && "bg-amber-300",
          tone === "red" && "bg-arena",
          tone === "neutral" && "bg-neutral-400",
        )}
      />
      {children}
    </span>
  );
}
