"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type GamingShellProps = {
  children: ReactNode;
  className?: string;
};

export function GamingShell({ children, className }: GamingShellProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    const list = Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(list);
  }, []);

  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-[#0a0a0c] text-white", className)}>
      {/* Obsidian background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0e0e12] via-[#09090c] to-[#050507]" />

      {/* Subtle ambient light aura */}
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-orange-600/5 blur-[120px]" />

      {/* Lightweight floating obsidian particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-orange-400/30 animate-pulse"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
