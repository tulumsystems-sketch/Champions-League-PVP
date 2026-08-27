import type { ReactNode } from "react";

import { StatusBadge } from "@/components/presentation/StatusBadge";

export function SectionHeading({
  kicker,
  kickerTone = "orange",
  title,
  description,
  action,
}: {
  kicker?: string;
  kickerTone?: "orange" | "cyan" | "emerald" | "yellow" | "red";
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {kicker ? <StatusBadge tone={kickerTone}>{kicker}</StatusBadge> : null}
        <h2 className={`${kicker ? "mt-3" : ""} font-heading text-2xl font-bold tracking-tight text-white md:text-3xl`}>
          {title}
        </h2>
        {description ? <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
