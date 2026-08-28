"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { DOCK_NAV, isNavActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#07080e]/94 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {DOCK_NAV.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold uppercase tracking-wide transition",
                  active ? "text-orange-300" : "text-neutral-500 hover:text-neutral-300",
                )}
              >
                <Icon className={cn("size-5", active && "text-orange-400")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
