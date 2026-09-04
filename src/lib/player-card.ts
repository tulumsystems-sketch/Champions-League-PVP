export type PlayerCardTier = "bronze" | "silver" | "gold" | "purple" | "rare" | "special" | "icon";

export type PlayerCardRank = {
  id: number | null;
  label: string;
  short: string;
  tier: PlayerCardTier;
};

const RANK_BY_ID: { max: number; label: string; short: string; tier: PlayerCardTier }[] = [
  { max: 0, label: "Sin rango", short: "BR", tier: "bronze" },
  { max: 3, label: "Bronce", short: "BRC", tier: "bronze" },
  { max: 6, label: "Plata", short: "PLT", tier: "silver" },
  { max: 10, label: "Oro", short: "ORO", tier: "gold" },
  { max: 14, label: "Platino", short: "PTN", tier: "rare" },
  { max: 18, label: "Diamante", short: "DMD", tier: "rare" },
  { max: 19, label: "Heroico", short: "HRO", tier: "special" },
  { max: 99, label: "Gran Maestro", short: "GM", tier: "icon" },
];

function divisionForRank(rank: number) {
  if (rank <= 3) return ["I", "II", "III"][rank - 1] || "I";
  if (rank <= 6) return ["I", "II", "III"][rank - 4] || "I";
  if (rank <= 10) return ["I", "II", "III", "IV"][rank - 7] || "I";
  if (rank <= 14) return ["I", "II", "III", "IV"][rank - 11] || "I";
  if (rank <= 18) return ["I", "II", "III", "IV"][rank - 15] || "I";
  return "";
}

export function resolvePlayerCardRank(rank: number | null | undefined, rankingPoints: number | null | undefined): PlayerCardRank {
  if (rank != null && rank >= 1 && rank <= 30) {
    const row = RANK_BY_ID.find((item) => rank <= item.max) || RANK_BY_ID[RANK_BY_ID.length - 1];
    const division = divisionForRank(rank);
    const label = division ? `${row.label} ${division}` : row.label;
    return { id: rank, label, short: row.short, tier: row.tier };
  }

  const points = rankingPoints ?? rank ?? 0;
  if (!points) return { id: null, label: "Sin rango", short: "BR", tier: "bronze" };
  if (points < 400) return { id: rank ?? null, label: "Bronce", short: "BRC", tier: "bronze" };
  if (points < 800) return { id: rank ?? null, label: "Plata", short: "PLT", tier: "silver" };
  if (points < 1400) return { id: rank ?? null, label: "Oro", short: "ORO", tier: "gold" };
  if (points < 2200) return { id: rank ?? null, label: "Platino", short: "PTN", tier: "rare" };
  if (points < 3200) return { id: rank ?? null, label: "Diamante", short: "DMD", tier: "rare" };
  if (points < 5000) return { id: rank ?? null, label: "Heroico", short: "HRO", tier: "special" };
  return { id: rank ?? null, label: "Gran Maestro", short: "GM", tier: "icon" };
}

export function playerCardOverall(input: {
  level?: number | null;
  rankingPoints?: number | null;
  kills?: number | null;
  wins?: number | null;
}) {
  const level = Math.max(0, Number(input.level || 0));
  const points = Math.max(0, Number(input.rankingPoints || 0));
  const kills = Math.max(0, Number(input.kills || 0));
  const wins = Math.max(0, Number(input.wins || 0));
  const value = 42 + level * 0.42 + Math.min(18, points / 220) + Math.min(8, Math.log10(kills + 1) * 4) + Math.min(6, wins / 80);
  return Math.max(45, Math.min(99, Math.round(value)));
}

export function formatCardStat(value: number | null | undefined) {
  const amount = Math.max(0, Math.floor(Number(value || 0)));
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (amount >= 10_000) return `${Math.round(amount / 1000)}K`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1).replace(".0", "")}K`;
  return String(amount);
}

export function playerCardTierFromLevel(level: number | null | undefined): PlayerCardTier {
  const lv = Math.max(0, Math.floor(Number(level || 0)));
  if (lv >= 80) return "icon";
  if (lv >= 65) return "special";
  if (lv >= 50) return "purple";
  if (lv >= 35) return "gold";
  if (lv >= 20) return "silver";
  return "bronze";
}

export function playerCardStars(tier: PlayerCardTier) {
  if (tier === "icon" || tier === "special") return 5;
  if (tier === "purple" || tier === "rare") return 4;
  if (tier === "gold") return 3;
  if (tier === "silver") return 2;
  return 1;
}

export function playerCardProgram(tier: PlayerCardTier) {
  if (tier === "icon") return "LEYENDA";
  if (tier === "special") return "ESPECIAL";
  if (tier === "purple" || tier === "rare") return "ÉLITE";
  if (tier === "gold") return "ÉPICO";
  if (tier === "silver") return "RARO";
  return "COMÚN";
}

export function cleanPlayerCardName(name: string) {
  const cleaned = name
    .replace(/【[^】]*】/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || name.trim() || "Jugador";
}

export function playerCardInitials(name: string) {
  const cleaned = cleanPlayerCardName(name);
  const parts = cleaned.split(" ").filter(Boolean).slice(0, 2);
  const letters = parts
    .map((part) => Array.from(part).find((char) => /[\p{L}\p{N}]/u.test(char)) || "")
    .join("")
    .toUpperCase();
  return letters.slice(0, 2) || "P";
}
