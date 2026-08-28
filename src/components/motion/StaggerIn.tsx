"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { motionDuration } from "@/lib/motion";

export function StaggerIn({
  children,
  selector = ":scope > *",
  replayKey,
  className,
}: {
  children: React.ReactNode;
  selector?: string;
  replayKey?: string | number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const items = node.querySelectorAll(selector);
    if (!items.length) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: motionDuration(0.42), stagger: motionDuration(0.05), ease: "power2.out" },
      );
    }, node);
    return () => ctx.revert();
  }, [selector, replayKey]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
