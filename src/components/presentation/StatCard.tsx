import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StatTone = "orange" | "cyan" | "emerald" | "yellow" | "red";

const toneClasses: Record<StatTone, string> = {
  orange: "border-orange-400/20 bg-orange-500/10 text-orange-200 shadow-orange-950/30",
  cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200 shadow-cyan-950/30",
  emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200 shadow-emerald-950/30",
  yellow: "border-yellow-400/20 bg-yellow-500/10 text-yellow-100 shadow-yellow-950/30",
  red: "border-red-400/20 bg-red-500/10 text-red-200 shadow-red-950/30",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = "orange",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  meta: string;
  tone?: StatTone;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-neutral-900/80 p-4 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white">{value}</p>
          <p className="mt-1 text-sm text-neutral-400">{meta}</p>
        </div>
        <div className={cn("rounded-lg border p-2 shadow-lg", toneClasses[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
