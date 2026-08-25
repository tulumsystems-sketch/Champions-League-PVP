"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MAIN_NAV, isNavActive } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-neutral-950/95 backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {MAIN_NAV.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition",
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
