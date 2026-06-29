// Presentation placeholder data. Replace with Supabase queries once the MVP schema is ready.
export const playerProfile = {
  nickname: "TulumAce",
  email: "player@championsleaguepvp.gg",
  freeFireUid: "938472615",
  tier: "Diamante II",
  status: "Cuenta activa",
  avatarInitials: "TA",
  joinedAt: "Junio 2026",
};

export const playerStats = [
  { label: "Partidas jugadas", value: "128", meta: "+18 esta semana" },
  { label: "Victorias", value: "42", meta: "32.8% win rate" },
  { label: "Kills", value: "916", meta: "7.1 promedio" },
  { label: "Puntos ranking", value: "8.420", meta: "Top 3%" },
];

export const challengeCards = [
  {
    title: "Desafío Fin de Semana",
    mode: "Solo PvP",
    prize: "90 Coins",
    entry: "10 Coins",
    starts: "Hoy 21:00",
    players: "42/64",
    status: "Abierto",
    accent: "orange" as const,
  },
  {
    title: "Headshot Rush",
    mode: "Kills + precisión",
    prize: "150 Coins",
    entry: "15 Coins",
    starts: "Mañana 19:30",
    players: "28/48",
    status: "Inscripción",
    accent: "cyan" as const,
  },
  {
    title: "Squad Night",
    mode: "4 vs 4",
    prize: "320 Coins",
    entry: "50 Coins",
    starts: "Sábado 22:00",
    players: "11/16 squads",
    status: "Premium",
    accent: "emerald" as const,
  },
];

export const rankingRows = [
  { position: 1, player: "RaptorFF", wins: 58, coins: 1240, points: 9820, trend: "+4" },
  { position: 2, player: "NexoPro", wins: 51, coins: 980, points: 9105, trend: "+1" },
  { position: 3, player: "TulumAce", wins: 42, coins: 760, points: 8420, trend: "+7" },
  { position: 4, player: "RushKing", wins: 39, coins: 690, points: 7990, trend: "-1" },
  { position: 5, player: "MayaShot", wins: 36, coins: 610, points: 7540, trend: "+2" },
];

export const activityItems = [
  { title: "Inscripción a Desafío Fin de Semana", meta: "Hace 12 min", amount: "-10 Coins", tone: "debit" as const },
  { title: "Premio por victoria 1 vs 1", meta: "Ayer", amount: "+25 Coins", tone: "credit" as const },
  { title: "UID Free Fire verificado", meta: "Ayer", amount: "OK", tone: "info" as const },
  { title: "Ingreso a sala privada", meta: "Lunes", amount: "-15 Coins", tone: "debit" as const },
];

export const accessCards = [
  {
    title: "Desafíos",
    description: "Competencias temporales con premios en Coins.",
    href: "/dashboard#desafios",
    accent: "orange" as const,
  },
  {
    title: "Salas privadas",
    description: "Entrá a salas 1 vs 1, 2 vs 2 y squads.",
    href: "/dashboard#salas",
    accent: "cyan" as const,
  },
  {
    title: "Ranking",
    description: "Medí tu progreso semanal contra otros jugadores.",
    href: "/dashboard#ranking",
    accent: "emerald" as const,
  },
  {
    title: "Wallet",
    description: "Balance, movimientos y premios de la arena.",
    href: "/dashboard#wallet",
    accent: "yellow" as const,
  },
  {
    title: "Perfil",
    description: "Nickname, avatar, UID y estado de cuenta.",
    href: "/profile",
    accent: "red" as const,
  },
];
