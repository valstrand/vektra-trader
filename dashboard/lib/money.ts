import type { Snapshot } from "./types";

// Speiler CASH-settet i agent/exchange.py — valutaer verdt 1 USD.
export const CASH = new Set(["USD", "UST", "USDT", "TESTUSD", "TESTUSDT"]);

export function cashOf(s: Snapshot): number | null {
  if (!s.values) return null;
  return Object.entries(s.values)
    .filter(([cur]) => CASH.has(cur))
    .reduce((sum, [, usd]) => sum + usd, 0);
}

export function investedOf(s: Snapshot): number | null {
  const cash = cashOf(s);
  return cash === null ? null : s.total_usd - cash;
}

export interface AssetRow {
  cur: string;
  usd: number;
  amount: number;
  isCash: boolean;
}

// Per-asset breakdown fra `values` (USD) + `balances` (mengder). Null for gamle snapshots.
export function assetBreakdown(s: Snapshot): AssetRow[] | null {
  if (!s.values) return null;
  return Object.entries(s.values)
    .map(([cur, usd]) => ({
      cur,
      usd,
      amount: s.balances[cur] ?? 0,
      isCash: CASH.has(cur),
    }))
    .filter((r) => r.usd > 0)
    .sort((a, b) => b.usd - a.usd);
}

export interface Pnl {
  abs: number;
  pct: number;
  first: number;
  last: number;
}

// P&L fra første til siste snapshot i perioden. Hopper over 0-verdier i starten
// (før kontoen ble fundet) for å unngå misvisende "+uendelig".
export function pnl(snapshots: Snapshot[]): Pnl | null {
  const nonZero = snapshots.filter((s) => s.total_usd > 0);
  if (nonZero.length < 1) return null;
  const first = nonZero[0].total_usd;
  const last = nonZero[nonZero.length - 1].total_usd;
  return { abs: last - first, pct: first ? ((last - first) / first) * 100 : 0, first, last };
}
