"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { motionDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";

type CountUpProps = {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
};

export function CountUp({ value, duration = 0.85, className, prefix = "", suffix = "" }: CountUpProps) {
  const [shown, setShown] = useState(0);
  const previous = useRef(0);
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const state = { n: previous.current };
    const tween = gsap.to(state, {
      n: value,
      duration: motionDuration(duration),
      ease: "power2.out",
      onUpdate: () => setShown(Math.round(state.n)),
    });
    if (nodeRef.current && previous.current !== value) {
      gsap.fromTo(nodeRef.current, { scale: 1.08 }, { scale: 1, duration: motionDuration(0.28), ease: "back.out(2)" });
    }
    previous.current = value;
    return () => {
      tween.kill();
    };
  }, [value, duration]);

  return (
    <span ref={nodeRef} className={cn("inline-block tabular-nums", className)}>
      {prefix}
      {shown.toLocaleString("es-AR")}
      {suffix}
    </span>
  );
}
