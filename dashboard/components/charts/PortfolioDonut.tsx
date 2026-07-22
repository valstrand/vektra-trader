"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AssetRow } from "@/lib/money";
import { fmtUsd } from "@/lib/format";

// Aksent for cash, varme toner for aktiva — rolig palett.
const COLORS = ["#2dd4a7", "#60a5fa", "#f59e0b", "#c084fc", "#f87171", "#34d399"];

export function PortfolioDonut({ rows }: { rows: AssetRow[] }) {
  const data = rows.map((r) => ({ name: r.cur, value: r.usd }));
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              color: "var(--color-fg)",
              fontSize: 13,
            }}
            formatter={(v, name) => [fmtUsd(Number(v)), String(name)]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
