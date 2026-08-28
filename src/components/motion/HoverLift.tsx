"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

import { cn } from "@/lib/utils";

export function HoverLift({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const enter = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      gsap.to(node, { y: -5, rotate: x * 1.4, duration: 0.24, ease: "power2.out", overwrite: "auto" });
    };
    const move = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      gsap.to(node, { rotate: x * 1.4, duration: 0.2, ease: "power2.out", overwrite: "auto" });
    };
    const leave = () => gsap.to(node, { y: 0, rotate: 0, duration: 0.3, ease: "power3.out" });

    node.addEventListener("mouseenter", enter);
    node.addEventListener("mousemove", move);
    node.addEventListener("mouseleave", leave);
    return () => {
      node.removeEventListener("mouseenter", enter);
      node.removeEventListener("mousemove", move);
      node.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
