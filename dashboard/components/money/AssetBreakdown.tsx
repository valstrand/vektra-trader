import type { AssetRow } from "@/lib/money";
import { fmtUsd, fmtNum } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

export function AssetBreakdown({ rows, total }: { rows: AssetRow[]; total: number }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => {
        const pct = total > 0 ? (r.usd / total) * 100 : 0;
        return (
          <li key={r.cur} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">{r.cur}</span>
              {r.isCash && <Badge tone="muted">cash</Badge>}
            </div>
            <div className="text-right">
              <div className="nums font-medium">{fmtUsd(r.usd)}</div>
              <div className="nums text-xs text-muted">
                {fmtNum(r.amount, 6)} · {fmtNum(pct, 0)} %
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
