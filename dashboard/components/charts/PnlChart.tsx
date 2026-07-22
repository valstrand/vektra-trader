"use client";

import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtUsd, fmtDateTime } from "@/lib/format";

export interface PnlPoint {
  t: string;
  usd: number;
}

export function PnlChart({ data, baseline }: { data: PnlPoint[]; baseline?: number }) {
  if (data.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted">
        For få datapunkter til å tegne kurve ennå.
      </div>
    );
  }
  const values = data.map((d) => d.usd);
  const min = Math.min(...values, baseline ?? Infinity);
  const max = Math.max(...values, baseline ?? -Infinity);
  const pad = (max - min) * 0.12 || 10;

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="pnl" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="t"
            tickFormatter={(t) => fmtDateTime(t).split(",")[0]}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => `$${Math.round(v)}`}
          />
          {baseline !== undefined && (
            <ReferenceLine
              y={baseline}
              stroke="var(--color-muted)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
          )}
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              color: "var(--color-fg)",
              fontSize: 13,
            }}
            labelFormatter={(t) => fmtDateTime(String(t))}
            formatter={(v) => [fmtUsd(Number(v)), "Total"]}
          />
          <Area
            type="monotone"
            dataKey="usd"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#pnl)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
