import type { Verdict } from "@/lib/types";

type Tone = "accent" | "positive" | "negative" | "warning" | "muted";

const TONES: Record<Tone, string> = {
  accent: "bg-accent/15 text-accent",
  positive: "bg-positive/15 text-positive",
  negative: "bg-negative/15 text-negative",
  warning: "bg-warning/15 text-warning",
  muted: "bg-surface-2 text-muted",
};

export function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const VERDICT_TONE: Record<Verdict, Tone> = {
  approve: "positive",
  reduce: "warning",
  reject: "negative",
};
const VERDICT_LABEL: Record<Verdict, string> = {
  approve: "Godkjent",
  reduce: "Nedskalert",
  reject: "Avvist",
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <Badge tone={VERDICT_TONE[verdict]}>{VERDICT_LABEL[verdict]}</Badge>;
}

const ACTION_LABEL: Record<string, string> = { buy: "Kjøp", sell: "Salg", hold: "Hold" };

export function ActionBadge({ action }: { action: string }) {
  const tone: Tone = action === "buy" ? "positive" : action === "sell" ? "negative" : "muted";
  return <Badge tone={tone}>{ACTION_LABEL[action] ?? action}</Badge>;
}
