import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export function LoadingPanel({ label, className }: { label: string; className?: string }) {
  return (
    <div className={cn("arena-panel flex items-center gap-3 p-5 text-neutral-300", className)}>
      <Loader2 className="size-5 animate-spin text-arena" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export function ErrorPanel({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="arena-err p-5">
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm text-red-100/75">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function EmptyPanel({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="arena-panel p-8 text-center">
      {icon ? <div className="mx-auto mb-4 flex justify-center text-arena">{icon}</div> : null}
      <h2 className="font-heading text-xl font-bold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-400">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
