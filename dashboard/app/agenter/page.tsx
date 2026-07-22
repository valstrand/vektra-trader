import { readClient } from "@/lib/supabase/server";
import type { Decision, Reflection } from "@/lib/types";
import { fmtRelative, fmtDate, fmtUsd } from "@/lib/format";
import { AgentCard, Reasoning } from "@/components/agents/AgentCard";
import { ConfidenceMeter } from "@/components/agents/ConfidenceMeter";
import { ActionBadge, VerdictBadge, Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const sb = readClient();
  const [{ data: decisions }, { data: reflections }] = await Promise.all([
    sb.from("decisions").select("*").order("created_at", { ascending: false }).limit(1),
    sb.from("reflections").select("*").order("created_at", { ascending: false }).limit(1),
  ]);

  const d = (decisions?.[0] as Decision) ?? null;
  const r = (reflections?.[0] as Reflection) ?? null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">Agentene</h1>
        <p className="text-sm text-muted">
          Hvordan hver rolle ser markedet nå — og hva de har lært.
        </p>
      </header>

      {!d ? (
        <p className="py-12 text-center text-muted">Ingen beslutninger ennå.</p>
      ) : (
        <>
          <AgentCard
            name="Analytikeren"
            role={`Siste vurdering ${fmtRelative(d.created_at)}`}
            meta={
              d.confidence !== null ? <ConfidenceMeter value={d.confidence} /> : undefined
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <ActionBadge action={d.action} />
              {d.pair && <Badge tone="muted">{d.pair}</Badge>}
              {d.amount_usd ? <Badge tone="muted">{fmtUsd(d.amount_usd)}</Badge> : null}
            </div>
            <Reasoning label="Slik ser jeg markedet" text={d.analyst_reasoning} />
            {d.lesson && <Reasoning label="Det jeg ser etter neste gang" text={d.lesson} />}
          </AgentCard>

          <AgentCard
            name="Risikosjefen"
            role="Vokter av rammene"
            meta={<VerdictBadge verdict={d.risk_verdict} />}
          >
            <Reasoning label="Vurdering" text={d.risk_reasoning} />
            {d.error && <Reasoning label="Feil ved eksekvering" text={d.error} />}
          </AgentCard>
        </>
      )}

      <AgentCard
        name="Læreren"
        role={r ? `Refleksjon ${fmtDate(r.created_at)} (${r.period_days} dager)` : "Ukentlig refleksjon"}
      >
        {r ? (
          <>
            <Reasoning label="Refleksjon" text={r.content} />
            {r.suggested_strategy_changes && (
              <Reasoning label="Foreslåtte strategiendringer" text={r.suggested_strategy_changes} />
            )}
          </>
        ) : (
          <p className="text-muted">Ingen ukesrefleksjon ennå. Læreren kjører ukentlig.</p>
        )}
      </AgentCard>
    </div>
  );
}
