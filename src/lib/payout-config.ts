/** Fallback until el admin carga CBU/USDT reales en /admin. */
export const PAYOUT_INSTRUCTIONS = {
  ars: {
    label: "Pesos argentinos (ARS)",
    bank: "Mercado Pago",
    cvu: "0000003100012345678999",
    alias: "CHAMPIONS.LEAGUE.PVP",
    note: "1 Coin = 1 USD. Transferí el equivalente en ARS al valor del día y subí el comprobante.",
  },
  usdt: {
    label: "USDT",
    network: "TRC20 (Tron)",
    address: "TXYZ123456789abcdefghijkLMNOPQRS99",
    note: "Enviá el monto exacto del plan en USDT. Red TRC20.",
  },
} as const;

export type PayoutMethod = keyof typeof PAYOUT_INSTRUCTIONS;
