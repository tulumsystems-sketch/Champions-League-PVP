import type { ReactNode } from "react";

import { StatusBadge } from "@/components/presentation/StatusBadge";

type PageHeaderProps = {
  badge?: string;
  badgeTone?: "orange" | "cyan" | "emerald" | "yellow" | "red";
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ badge, badgeTone = "orange", title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
      <div>
        {badge && <StatusBadge tone={badgeTone}>{badge}</StatusBadge>}
        <h1 className={`${badge ? "mt-4" : ""} text-3xl font-black tracking-tight text-white md:text-4xl`}>{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
