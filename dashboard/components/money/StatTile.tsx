export function StatTile({
  label,
  value,
  sub,
  tone = "default",
  large = false,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "positive" | "negative";
  large?: boolean;
}) {
  const valueTone =
    tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-fg";
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-xs font-medium tracking-wide text-muted uppercase">{label}</div>
      <div className={`nums mt-1 font-semibold ${large ? "text-3xl" : "text-xl"} ${valueTone}`}>
        {value}
      </div>
      {sub && <div className="nums mt-0.5 text-sm text-muted">{sub}</div>}
    </div>
  );
}
