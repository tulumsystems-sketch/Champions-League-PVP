import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type GamingShellProps = {
  children: ReactNode;
  className?: string;
};

export function GamingShell({ children, className }: GamingShellProps) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-neutral-950 text-white", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(10,10,10,0.98),rgba(23,23,23,0.96)_45%,rgba(8,18,19,0.98))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(90deg,rgba(234,88,12,0.24),rgba(20,184,166,0.18),rgba(22,163,74,0.14))] blur-3xl" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
