"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { HoverLift } from "@/components/motion/HoverLift";
import { cn } from "@/lib/utils";

type Accent = "orange" | "cyan" | "emerald" | "yellow" | "red";

const accentClasses: Record<Accent, string> = {
  orange: "from-orange-500/25 to-orange-500/5 text-orange-200 ring-orange-400/30",
  cyan: "from-cyan-500/25 to-cyan-500/5 text-cyan-200 ring-cyan-400/30",
  emerald: "from-emerald-500/25 to-emerald-500/5 text-emerald-200 ring-emerald-400/30",
  yellow: "from-amber-500/25 to-amber-500/5 text-amber-100 ring-amber-400/30",
  red: "from-red-500/25 to-red-500/5 text-red-200 ring-red-400/30",
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  accent = "orange",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  accent?: Accent;
}) {
  return (
    <HoverLift>
      <Link href={href} className="arena-panel group block h-full p-5 outline-none transition hover:border-white/20 focus-visible:ring-2 focus-visible:ring-orange-400/60">
        <div className="flex items-start justify-between gap-4">
          <div className={cn("rounded-lg bg-gradient-to-br p-2.5 ring-1", accentClasses[accent])}>
            <Icon className="size-5" />
          </div>
          <ArrowUpRight className="size-4 text-neutral-500 transition group-hover:text-cyan-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <h3 className="mt-5 font-heading text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-400">{description}</p>
      </Link>
    </HoverLift>
  );
}
