import type { ReactNode } from "react";

import { LivePulse } from "@/components/hud/LivePulse";
import { StatusBadge } from "@/components/presentation/StatusBadge";

type PageHeaderProps = {
  badge?: string;
  badgeTone?: "orange" | "cyan" | "emerald" | "yellow" | "red";
  title: string;
  description?: string;
  actions?: ReactNode;
  live?: boolean;
};

export function PageHeader({ badge, badgeTone = "orange", title, description, actions, live }: PageHeaderProps) {
  return (
    <div className="arena-panel relative flex flex-col justify-between gap-5 overflow-hidden p-6 md:flex-row md:items-end md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-arena/12 blur-3xl" />
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {badge && <StatusBadge tone={badgeTone}>{badge}</StatusBadge>}
          {live ? <LivePulse /> : null}
        </div>
        <h1 className={`${badge || live ? "mt-3" : ""} font-heading text-3xl font-bold tracking-tight text-white md:text-4xl`}>
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
