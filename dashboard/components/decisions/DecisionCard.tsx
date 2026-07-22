import type { Decision } from "@/lib/types";
import { fmtDateTime, fmtUsd, fmtNum } from "@/lib/format";
import { ActionBadge, VerdictBadge, Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export function DecisionCard({ d }: { d: Decision }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ActionBadge action={d.action} />
          {d.pair && <span className="font-medium">{d.pair}</span>}
          {d.amount_usd ? <span className="nums text-muted">{fmtUsd(d.amount_usd)}</span> : null}
        </div>
        <time className="shrink-0 text-xs text-muted">{fmtDateTime(d.created_at)}</time>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <VerdictBadge verdict={d.risk_verdict} />
        {d.confidence !== null && (
          <Badge tone="muted">conf {fmtNum(d.confidence * 100, 0)} %</Badge>
        )}
        {d.executed ? (
          <Badge tone="positive">utført</Badge>
        ) : d.error ? (
          <Badge tone="negative">blokkert</Badge>
        ) : null}
      </div>

      <details className="group mt-3">
        <summary className="cursor-pointer list-none text-sm text-accent select-none">
          <span className="group-open:hidden">Vis begrunnelse</span>
          <span className="hidden group-open:inline">Skjul begrunnelse</span>
        </summary>
        <div className="mt-3 space-y-3 text-sm leading-relaxed">
          <Block label="Analytiker" text={d.analyst_reasoning} />
          <Block label="Risikosjef" text={d.risk_reasoning} />
          {d.lesson && <Block label="Lærdom" text={d.lesson} />}
          {d.error && <Block label="Feil" text={d.error} />}
        </div>
      </details>
    </Card>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium tracking-wide text-muted uppercase">{label}</div>
      <p className="whitespace-pre-wrap border-l-2 border-border pl-3 text-fg/80">{text}</p>
    </div>
  );
}
