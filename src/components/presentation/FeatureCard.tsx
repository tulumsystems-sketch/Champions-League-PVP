"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { HoverLift } from "@/components/motion/HoverLift";
import { cn } from "@/lib/utils";

type Accent = "orange" | "cyan" | "emerald" | "yellow" | "red";

const accentClasses: Record<Accent, string> = {
  orange: "from-arena/25 to-arena/5 text-arena ring-arena/30",
  cyan: "from-white/15 to-white/5 text-white/80 ring-white/20",
  emerald: "from-emerald-500/25 to-emerald-500/5 text-emerald-200 ring-emerald-400/30",
  yellow: "from-amber-500/25 to-amber-500/5 text-amber-100 ring-amber-400/30",
  red: "from-arena/25 to-arena/5 text-arena ring-arena/30",
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
      <Link href={href} className="arena-panel group block h-full p-5 outline-none transition hover:border-arena/40 focus-visible:ring-2 focus-visible:ring-arena/60">
        <div className="flex items-start justify-between gap-4">
          <div className={cn("rounded-lg bg-gradient-to-br p-2.5 ring-1", accentClasses[accent])}>
            <Icon className="size-5" />
          </div>
          <ArrowUpRight className="size-4 text-neutral-500 transition group-hover:text-arena group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
        <h3 className="mt-5 font-heading text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-400">{description}</p>
      </Link>
    </HoverLift>
  );
}
