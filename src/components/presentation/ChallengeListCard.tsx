import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { StatusBadge } from "@/components/presentation/StatusBadge";
import {
  challengeBannerSrc,
  challengeStatusLabel,
  challengeStatusTone,
  type Challenge,
} from "@/lib/challenges";
import { metricLabel } from "@/lib/player-stats";

import "./challenge-banner.css";

export function ChallengeListCard({
  challenge,
  ctaLabel,
}: {
  challenge: Challenge;
  ctaLabel?: string;
}) {
  const closed = challenge.status === "completed" || challenge.status === "cancelled";
  const label = ctaLabel ?? (closed ? "Ver resultado" : "Ver desafío");
  const prizes = [
    { place: "1°", coins: challenge.prizeFirst },
    { place: "2°", coins: challenge.prizeSecond },
    { place: "3°", coins: challenge.prizeThird },
  ];

  return (
    <Link
      href={`/challenges/${challenge.id}`}
      className="challenge-banner group"
      data-closed={closed ? "true" : "false"}
    >
      <Image
        src={challengeBannerSrc(challenge.metric)}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 1100px"
        className="challenge-banner-art"
      />
      <div className="challenge-banner-shade" />

      <div className="challenge-banner-body">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={challengeStatusTone(challenge.status)}>
              {challengeStatusLabel(challenge.status)}
            </StatusBadge>
            <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/80">
              {metricLabel(challenge.metric)}
            </span>
            <span className="rounded-full border border-arena/35 bg-arena/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-arena">
              {challenge.entry_fee} Coins
            </span>
          </div>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
            {challenge.title}
          </h2>
          <p className="mt-2 line-clamp-2 max-w-lg text-sm leading-6 text-white/70">
            {challenge.description || "Torneo Battle Royale de Free Fire."}
          </p>
          <p className="mt-3 text-xs font-semibold text-white/50">
            {formatDateRange(challenge.start_date, challenge.end_date)}
            {challenge.max_players ? ` · ${challenge.max_players} cupos máx.` : " · Cupos abiertos"}
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="challenge-banner-prizes">
            {prizes.map((prize) => (
              <div key={prize.place} className="challenge-banner-prize">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">{prize.place}</p>
                <p className="mt-0.5 font-heading text-sm font-bold tabular-nums text-white">{prize.coins}</p>
              </div>
            ))}
          </div>
          <span className="challenge-banner-cta">
            {label}
            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) return "Fechas a confirmar";
  if (startDate && !endDate) return `Desde ${formatDate(startDate)}`;
  if (!startDate && endDate) return `Hasta ${formatDate(endDate)}`;
  return `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
