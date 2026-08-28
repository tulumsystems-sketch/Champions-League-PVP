export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function motionDuration(seconds: number) {
  return prefersReducedMotion() ? 0 : seconds;
}
