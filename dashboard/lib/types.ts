// Speiler Supabase-skjemaet (supabase/schema.sql). Norsk i UI, engelsk i felt.

export type Env = "paper" | "live";
export type Action = "buy" | "sell" | "hold";
export type Verdict = "approve" | "reduce" | "reject";

export interface TraderConfig {
  id: number;
  kill_switch: boolean;
  cycle_hours: number;
  max_position_pct: number;
  max_trades_per_day: number;
  min_order_usd: number;
  allowed_pairs: string[];
  updated_at: string;
}

export interface Decision {
  id: number;
  created_at: string;
  env: Env;
  action: Action;
  pair: string | null;
  amount_usd: number | null;
  analyst_reasoning: string;
  risk_reasoning: string;
  risk_verdict: Verdict;
  confidence: number | null;
  lesson: string | null;
  order_id: string | null;
  executed: boolean;
  error: string | null;
}

export interface Snapshot {
  id: number;
  created_at: string;
  env: Env;
  total_usd: number;
  balances: Record<string, number>;
  values: Record<string, number> | null;
}

export interface Reflection {
  id: number;
  created_at: string;
  period_days: number;
  content: string;
  suggested_strategy_changes: string | null;
}
