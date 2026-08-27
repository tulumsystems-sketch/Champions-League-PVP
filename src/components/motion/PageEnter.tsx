"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { motionDuration } from "@/lib/motion";

export function PageEnter({ children, replayKey }: { children: React.ReactNode; replayKey?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        node,
        { opacity: 0, y: 18, filter: "blur(6px)" },
        { opacity: 1, y: 0, filter: "blur(0px)", duration: motionDuration(0.48), ease: "power3.out" },
      );
    }, node);
    return () => ctx.revert();
  }, [replayKey]);

  return (
    <div ref={ref} className="page-enter">
      {children}
    </div>
  );
}
