"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";

import { cn } from "@/lib/utils";

type GamingShellProps = {
  children: ReactNode;
  className?: string;
};

export function GamingShell({ children, className }: GamingShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sparks = root.querySelectorAll("[data-spark]");
    const ctx = gsap.context(() => {
      sparks.forEach((spark, index) => {
        gsap.to(spark, {
          y: gsap.utils.random(-32, 32),
          x: gsap.utils.random(-20, 20),
          opacity: gsap.utils.random(0.12, 0.5),
          duration: gsap.utils.random(5, 9),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.1,
          force3D: true,
        });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className={cn("relative min-h-screen text-white", className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 arena-grid opacity-40" />
        <div className="absolute inset-0 arena-noise" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,83,24,0.14),transparent_38%),radial-gradient(circle_at_92%_8%,rgba(46,230,255,0.08),transparent_34%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/80 to-transparent" />
        <div className="arena-scan" />
        {Array.from({ length: 20 }).map((_, index) => (
          <span
            key={index}
            data-spark
            className="absolute rounded-full bg-orange-300/70 will-change-transform"
            style={{
              left: `${(index * 17) % 100}%`,
              top: `${(index * 29) % 100}%`,
              width: index % 3 === 0 ? 3 : 2,
              height: index % 3 === 0 ? 3 : 2,
            }}
          />
        ))}
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
