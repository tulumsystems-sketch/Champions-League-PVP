"use client";

import type { LucideIcon } from "lucide-react";

import { CountUp } from "@/components/motion/CountUp";
import { cn } from "@/lib/utils";

type StatTone = "orange" | "cyan" | "emerald" | "yellow" | "red";

const toneClasses: Record<StatTone, string> = {
  orange: "border-orange-400/20 bg-orange-500/10 text-orange-200",
  cyan: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
  emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  yellow: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  red: "border-red-400/20 bg-red-500/10 text-red-200",
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
