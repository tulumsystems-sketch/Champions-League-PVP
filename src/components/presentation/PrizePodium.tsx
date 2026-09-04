import { cn } from "@/lib/utils";

export function PrizePodium({
  first,
  second,
  third,
}: {
  first: number;
  second: number;
  third: number;
}) {
  const slots = [
    { place: "1°", coins: first, className: "border-amber-400/35 bg-amber-500/10 text-amber-100" },
    { place: "2°", coins: second, className: "border-white/15 bg-white/6 text-white/85" },
    { place: "3°", coins: third, className: "border-orange-500/30 bg-orange-500/10 text-orange-100" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => (
        <div key={slot.place} className={cn("rounded-xl border px-2 py-2 text-center", slot.className)}>
          <p className="text-[10px] font-black uppercase tracking-[0.16em]">{slot.place}</p>
          <p className="mt-1 font-heading text-sm font-bold tabular-nums">{slot.coins}</p>
        </div>
      ))}
    </div>
  );
}
