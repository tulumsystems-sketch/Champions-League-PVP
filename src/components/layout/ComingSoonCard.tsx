import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";

export function ComingSoonCard({
  icon: Icon,
  title,
  description,
  tone = "cyan",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "orange" | "cyan" | "emerald" | "yellow";
}) {
  return (
    <article className="rounded-lg border border-dashed border-white/15 bg-neutral-900/50 p-5 opacity-90">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-neutral-300">
          <Icon className="size-6" />
        </div>
        <StatusBadge tone={tone}>Próximamente</StatusBadge>
      </div>
      <h3 className="mt-4 text-xl font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
      <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">
        <Clock className="size-3.5" />
        En desarrollo
      </div>
    </article>
  );
}
