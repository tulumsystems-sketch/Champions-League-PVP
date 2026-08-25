export const FREE_FIRE_REGIONS = [
  { value: "br", label: "BR / LATAM / US / NA", hint: "Brasil, Estados Unidos, Latinoamérica" },
  { value: "sg", label: "SG / SEA / EU / CIS", hint: "Singapur, Indonesia, Europa, etc." },
  { value: "ind", label: "India", hint: "Servidor de India" },
] as const;

export type FreeFireRegionCode = (typeof FREE_FIRE_REGIONS)[number]["value"];

const REGION_ALIASES: Record<string, FreeFireRegionCode> = {
  br: "br",
  brazil: "br",
  brasil: "br",
  latam: "br",
  na: "br",
  us: "br",
  usa: "br",
  sg: "sg",
  id: "sg",
  indonesia: "sg",
  vn: "sg",
  th: "sg",
  eu: "sg",
  cis: "sg",
  tw: "sg",
  my: "sg",
  pk: "sg",
  bd: "sg",
  ind: "ind",
  india: "ind",
};

export function normalizeFreeFireRegion(input?: string | null, fallback: FreeFireRegionCode = "br"): FreeFireRegionCode {
  const normalized = input?.trim().toLowerCase();
  if (!normalized) return fallback;
  return REGION_ALIASES[normalized] || fallback;
}

export function getFreeFireRegionLabel(code: string) {
  return FREE_FIRE_REGIONS.find((region) => region.value === code)?.label || code.toUpperCase();
}
