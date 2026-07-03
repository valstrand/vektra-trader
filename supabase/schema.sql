-- Vektra Trader — Supabase-skjema
-- Kjør i SQL Editor. Idempotent nok til å kjøres på nytt.

create table if not exists trader_config (
  id            int primary key default 1 check (id = 1),  -- én rad
  kill_switch   boolean not null default false,
  cycle_hours   numeric not null default 4,
  max_position_pct    numeric not null default 25,   -- maks % av portefølje per trade
  max_trades_per_day  int not null default 2,
  min_order_usd       numeric not null default 10,
  allowed_pairs text[] not null default array['BTC/USD','ETH/USD','LTC/USD','XRP/USD'],
  updated_at    timestamptz not null default now()
);
insert into trader_config (id) values (1) on conflict (id) do nothing;

create table if not exists decisions (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  env         text not null default 'paper',            -- paper | live
  action      text not null,                            -- buy | sell | hold
  pair        text,
  amount_usd  numeric,
  analyst_reasoning text not null,
  risk_reasoning    text not null,
  risk_verdict      text not null,                      -- approve | reduce | reject
  confidence  numeric,                                  -- 0..1 fra analytikeren
  lesson      text,                                     -- "hva jeg ser etter neste gang"
  order_id    text,                                     -- Bitfinex ordre-ID hvis eksekvert
  executed    boolean not null default false,
  error       text
);

create table if not exists snapshots (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  env         text not null default 'paper',
  total_usd   numeric not null,
  balances    jsonb not null                            -- {"BTC": 0.001, "USD": 120, ...}
);

create table if not exists reflections (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  period_days int not null,
  content     text not null,                            -- Lærerens ukesrefleksjon
  suggested_strategy_changes text
);

-- RLS: åpent for service role (agenten), read-only for anon (dashboardet).
alter table trader_config enable row level security;
alter table decisions     enable row level security;
alter table snapshots     enable row level security;
alter table reflections   enable row level security;

create policy "anon read decisions"   on decisions   for select to anon using (true);
create policy "anon read snapshots"   on snapshots   for select to anon using (true);
create policy "anon read reflections" on reflections for select to anon using (true);
create policy "anon read config"      on trader_config for select to anon using (true);
-- service role omgår RLS automatisk, så agenten trenger ingen policies.
