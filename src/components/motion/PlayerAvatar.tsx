"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { motionDuration } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PlayerAvatarProps = {
  src?: string | null;
  name: string;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: "size-9 text-[11px]",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
};

export function PlayerAvatar({ src, name, initials, size = "md", className }: PlayerAvatarProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const ring = ringRef.current;
    const face = faceRef.current;
    if (!wrap || !ring || !face) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        face,
        { scale: 0.7, opacity: 0, rotate: -8 },
        { scale: 1, opacity: 1, rotate: 0, duration: motionDuration(0.5), ease: "back.out(1.6)" },
      );
      gsap.fromTo(ring, { rotate: -40, opacity: 0 }, { rotate: 0, opacity: 1, duration: motionDuration(0.7), ease: "power3.out" });
      if (motionDuration(1) > 0) {
        gsap.to(ring, { rotate: 360, duration: 16, ease: "none", repeat: -1 });
      }
    }, wrap);

    const onMove = (event: MouseEvent) => {
      const rect = wrap.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(face, { rotationY: x * 14, rotationX: -y * 10, duration: 0.25, ease: "power2.out", overwrite: "auto" });
    };
    const onLeave = () => {
      gsap.to(face, { rotationY: 0, rotationX: 0, duration: 0.4, ease: "power3.out" });
    };

    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);

    return () => {
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
      ctx.revert();
    };
  }, [src]);

  return (
    <div ref={wrapRef} className={cn("relative shrink-0 [perspective:600px]", sizes[size], className)}>
      <span
        ref={ringRef}
        className="pointer-events-none absolute -inset-[3px] rounded-[18px] bg-[conic-gradient(from_120deg,#ff5318,#2ee6ff,#f0c14b,#ff5318)] opacity-85"
      />
      <div
        ref={faceRef}
        className="relative flex size-full items-center justify-center overflow-hidden rounded-[15px] border border-white/15 bg-[#121218] font-heading font-bold tracking-wide text-white will-change-transform"
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="size-full object-cover" />
        ) : (
          initials || name.slice(0, 1).toUpperCase()
        )}
      </div>
    </div>
  );
}
