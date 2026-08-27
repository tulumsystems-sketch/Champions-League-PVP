import type { LucideIcon } from "lucide-react";
import { Crosshair, LayoutDashboard, Trophy, UserRound, UsersRound, WalletCards } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  disabled?: boolean;
  badge?: string;
};

export const MAIN_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    description: "Resumen de tu cuenta y actividad",
  },
  {
    href: "/challenges",
    label: "Desafíos",
    icon: Crosshair,
    description: "Competencias activas e inscripciones",
  },
  {
    href: "/rooms",
    label: "Salas",
    icon: UsersRound,
    description: "Salas privadas 1v1, 2v2, 3v3 y 4v4",
  },
  {
    href: "/ranking",
    label: "Ranking",
    icon: Trophy,
    description: "Leaderboard de la arena",
  },
  {
    href: "/wallet",
    label: "Wallet",
    icon: WalletCards,
    description: "Balance y movimientos de Coins",
  },
  {
    href: "/profile",
    label: "Perfil",
    icon: UserRound,
    description: "UID Free Fire, nickname y avatar",
  },
];

export const DOCK_NAV: NavItem[] = MAIN_NAV.filter((item) => item.href !== "/profile");

export const COMING_SOON_NAV: NavItem[] = [];

export const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/register/completion"];

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}
