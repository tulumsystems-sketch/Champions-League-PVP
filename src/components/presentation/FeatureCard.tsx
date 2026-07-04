import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Accent = "orange" | "cyan" | "emerald" | "yellow" | "red";

const accentClasses: Record<Accent, string> = {
  orange: "from-orange-500/20 to-orange-500/5 text-orange-200 ring-orange-400/25",
  cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-200 ring-cyan-400/25",
  emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-200 ring-emerald-400/25",
  yellow: "from-yellow-500/20 to-yellow-500/5 text-yellow-100 ring-yellow-400/25",
  red: "from-red-500/20 to-red-500/5 text-red-200 ring-red-400/25",
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
    <Link
      href={href}
      className="group rounded-lg border border-white/10 bg-neutral-900/75 p-5 shadow-2xl shadow-black/25 outline-none transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-neutral-900 focus-visible:ring-2 focus-visible:ring-orange-400/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn("rounded-lg bg-gradient-to-br p-2.5 ring-1", accentClasses[accent])}>
          <Icon className="size-5" />
        </div>
        <ArrowUpRight className="size-4 text-neutral-500 transition group-hover:text-white" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{description}</p>
    </Link>
  );
}
