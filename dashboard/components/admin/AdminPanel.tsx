"use client";

import { useActionState, useState } from "react";
import type { TraderConfig } from "@/lib/types";
import { PROFILES, LIMITS, KNOWN_PAIRS, matchProfile } from "@/lib/risk-profiles";
import { saveConfig, logout, type FormState } from "@/app/admin/actions";
import { fmtUsd, fmtNum } from "@/lib/format";
import { Card, SectionTitle } from "@/components/ui/Card";

interface State {
  kill_switch: boolean;
  max_position_pct: number;
  max_trades_per_day: number;
  cycle_hours: number;
  min_order_usd: number;
  allowed_pairs: string[];
}

export function AdminPanel({ config, totalUsd }: { config: TraderConfig; totalUsd: number | null }) {
  const [s, setS] = useState<State>({
    kill_switch: config.kill_switch,
    max_position_pct: config.max_position_pct,
    max_trades_per_day: config.max_trades_per_day,
    cycle_hours: config.cycle_hours,
    min_order_usd: config.min_order_usd,
    allowed_pairs: config.allowed_pairs,
  });
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveConfig, {});

  const active = matchProfile(s);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const applyProfile = (cfg: (typeof PROFILES)[number]["config"]) => setS((p) => ({ ...p, ...cfg }));
  const togglePair = (pair: string) =>
    setS((p) => ({
      ...p,
      allowed_pairs: p.allowed_pairs.includes(pair)
        ? p.allowed_pairs.filter((x) => x !== pair)
        : [...p.allowed_pairs, pair],
    }));

  const perTrade = totalUsd !== null ? (totalUsd * s.max_position_pct) / 100 : null;

  return (
    <form action={formAction} className="space-y-5">
      {/* Kill switch */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Kill switch</h3>
            <p className="text-sm text-muted">Stopper all handel umiddelbart.</p>
          </div>
          <button
            type="button"
            onClick={() => set("kill_switch", !s.kill_switch)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              s.kill_switch ? "bg-negative" : "bg-surface-2"
            }`}
            aria-pressed={s.kill_switch}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
                s.kill_switch ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        <input type="hidden" name="kill_switch" value={s.kill_switch ? "on" : "off"} />
      </Card>

      {/* Risikoprofiler */}
      <div>
        <SectionTitle>Risikoprofil</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {PROFILES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyProfile(p.config)}
              className={`rounded-2xl border p-3 text-left transition-colors ${
                active === p.key
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface hover:border-muted"
              }`}
            >
              <div className="text-sm font-semibold">{p.label}</div>
              <div className="mt-1 text-xs leading-snug text-muted">{p.description}</div>
            </button>
          ))}
        </div>
        {active === "tilpasset" && (
          <p className="mt-2 text-xs text-muted">Tilpasset — verdiene avviker fra profilene.</p>
        )}
      </div>

      {/* Slidere */}
      <Card className="space-y-5">
        <Slider
          name="max_position_pct"
          label="Maks posisjon per trade"
          value={s.max_position_pct}
          min={LIMITS.max_position_pct[0]}
          max={LIMITS.max_position_pct[1]}
          step={1}
          suffix=" %"
          hint={perTrade !== null ? `≈ ${fmtUsd(perTrade)} av dagens portefølje` : undefined}
          onChange={(v) => set("max_position_pct", v)}
        />
        <Slider
          name="max_trades_per_day"
          label="Maks trades per dag"
          value={s.max_trades_per_day}
          min={LIMITS.max_trades_per_day[0]}
          max={LIMITS.max_trades_per_day[1]}
          step={1}
          onChange={(v) => set("max_trades_per_day", v)}
        />
        <Slider
          name="cycle_hours"
          label="Timer mellom beslutninger"
          value={s.cycle_hours}
          min={LIMITS.cycle_hours[0]}
          max={LIMITS.cycle_hours[1]}
          step={1}
          suffix=" t"
          hint="Lavere = mer aktiv agent"
          onChange={(v) => set("cycle_hours", v)}
        />
        <Slider
          name="min_order_usd"
          label="Minste ordre"
          value={s.min_order_usd}
          min={LIMITS.min_order_usd[0]}
          max={LIMITS.min_order_usd[1]}
          step={1}
          prefix="$"
          onChange={(v) => set("min_order_usd", v)}
        />
      </Card>

      {/* Tillatte par */}
      <Card>
        <SectionTitle>Tillatte par</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {KNOWN_PAIRS.map((pair) => {
            const on = s.allowed_pairs.includes(pair);
            return (
              <label key={pair} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="allowed_pairs"
                  value={pair}
                  checked={on}
                  onChange={() => togglePair(pair)}
                  className="peer sr-only"
                />
                <span
                  className={`inline-block rounded-full border px-3 py-1 text-sm transition-colors ${
                    on ? "border-accent bg-accent/10 text-accent" : "border-border text-muted"
                  }`}
                >
                  {pair}
                </span>
              </label>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-accent px-5 py-2.5 font-medium text-bg disabled:opacity-60"
        >
          {pending ? "Lagrer…" : "Lagre endringer"}
        </button>
        <div className="text-sm">
          {state.ok && <span className="text-positive">Lagret ✓</span>}
          {state.error && <span className="text-negative">{state.error}</span>}
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="ml-auto text-sm text-muted hover:text-fg"
        >
          Logg ut
        </button>
      </div>
    </form>
  );
}

function Slider({
  name,
  label,
  value,
  min,
  max,
  step,
  prefix = "",
  suffix = "",
  hint,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm">{label}</span>
        <span className="nums text-sm font-semibold text-accent">
          {prefix}
          {fmtNum(value, 0)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        name={name}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--color-accent)]"
      />
      {hint && <p className="nums mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
