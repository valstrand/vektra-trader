import { readClient } from "@/lib/supabase/server";
import type { Decision } from "@/lib/types";
import { DecisionCard } from "@/components/decisions/DecisionCard";

export const dynamic = "force-dynamic";

export default async function LogPage() {
  const sb = readClient();
  const { data } = await sb
    .from("decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const decisions = (data ?? []) as Decision[];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">Beslutningslogg</h1>
        <p className="text-sm text-muted">Hver syklus, nyeste først — agentens sammenhengende tankerekke.</p>
      </header>

      {decisions.length === 0 ? (
        <p className="py-12 text-center text-muted">Ingen beslutninger ennå.</p>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <DecisionCard key={d.id} d={d} />
          ))}
        </div>
      )}
    </div>
  );
}
