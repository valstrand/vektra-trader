import type { TraderConfig } from "./types";

// Justerbare config-felt (trader_config). Sannheten for håndhevingen bor i
// agent/risk.py — dashboardet foreslår kun verdier, koden bestemmer.
export type AdjustableConfig = Pick<
  TraderConfig,
  "max_position_pct" | "max_trades_per_day" | "cycle_hours" | "min_order_usd"
>;

export interface RiskProfile {
  key: string;
  label: string;
  description: string;
  config: AdjustableConfig;
}

export const PROFILES: RiskProfile[] = [
  {
    key: "konservativ",
    label: "Konservativ",
    description: "Små posisjoner, sjeldne trades. Bevarer kapital.",
    config: { max_position_pct: 10, max_trades_per_day: 1, cycle_hours: 8, min_order_usd: 25 },
  },
  {
    key: "balansert",
    label: "Balansert",
    description: "Standardoppsettet. Moderat risiko og aktivitet.",
    config: { max_position_pct: 25, max_trades_per_day: 2, cycle_hours: 4, min_order_usd: 10 },
  },
  {
    key: "aggressiv",
    label: "Aggressiv",
    description: "Større posisjoner, hyppigere trades. Mer risiko.",
    config: { max_position_pct: 40, max_trades_per_day: 4, cycle_hours: 2, min_order_usd: 10 },
  },
];

// [min, max] grenser — validert både i UI og på nytt i server action.
export const LIMITS = {
  max_position_pct: [1, 50] as const,
  max_trades_per_day: [0, 10] as const,
  cycle_hours: [1, 24] as const,
  min_order_usd: [5, 100] as const,
};

// Par som finnes på paper-kontoen (TEST*) + ekte par. Se agent-repoets allowed_pairs.
export const KNOWN_PAIRS = [
  "TESTBTC/TESTUSD",
  "TESTETH/TESTUSD",
  "TESTLTC/TESTUSD",
  "TESTSOL/TESTUSD",
  "BTC/USD",
  "ETH/USD",
  "LTC/USD",
];

// Finn hvilken profil en config matcher (for å markere aktiv profil), ellers "Tilpasset".
export function matchProfile(cfg: AdjustableConfig): string {
  const hit = PROFILES.find(
    (p) =>
      p.config.max_position_pct === cfg.max_position_pct &&
      p.config.max_trades_per_day === cfg.max_trades_per_day &&
      p.config.cycle_hours === cfg.cycle_hours &&
      p.config.min_order_usd === cfg.min_order_usd,
  );
  return hit ? hit.key : "tilpasset";
}
