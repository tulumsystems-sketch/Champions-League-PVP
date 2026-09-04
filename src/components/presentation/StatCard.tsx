"use client";

import type { LucideIcon } from "lucide-react";

import { CountUp } from "@/components/motion/CountUp";
import { cn } from "@/lib/utils";

type StatTone = "orange" | "cyan" | "emerald" | "yellow" | "red";

const toneClasses: Record<StatTone, string> = {
  orange: "border-arena/20 bg-arena/10 text-arena",
  cyan: "border-white/15 bg-white/8 text-white/80",
  emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  yellow: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  red: "border-arena/20 bg-arena/10 text-arena",
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
  const numeric = Number(String(value).replace(/[^\d.-]/g, ""));
  const canCount = Number.isFinite(numeric) && String(value).replace(/[^\d.-]/g, "") !== "";

  return (
    <div className="arena-stat">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="arena-kicker">{label}</p>
          <p className="mt-2 font-heading text-3xl font-bold tracking-tight text-white">
            {canCount ? <CountUp value={numeric} /> : value}
          </p>
          <p className="mt-1 text-sm text-neutral-400">{meta}</p>
        </div>
        <div className={cn("rounded-lg border p-2", toneClasses[tone])}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}
