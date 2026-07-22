import { fmtNum } from "@/lib/format";

export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const tone = pct >= 60 ? "bg-positive" : pct >= 40 ? "bg-warning" : "bg-negative";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="nums text-xs text-muted">{fmtNum(value * 100, 0)} %</span>
    </div>
  );
}
