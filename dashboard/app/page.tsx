import { readClient } from "@/lib/supabase/server";
import type { Snapshot, TraderConfig } from "@/lib/types";
import { cashOf, investedOf, assetBreakdown, pnl } from "@/lib/money";
import { fmtUsd, fmtPct, fmtRelative, sinceIso } from "@/lib/format";
import { StatTile } from "@/components/money/StatTile";
import { PnlChart } from "@/components/charts/PnlChart";
import { PortfolioDonut } from "@/components/charts/PortfolioDonut";
import { AssetBreakdown } from "@/components/money/AssetBreakdown";
import { PeriodSelector } from "@/components/ui/PeriodSelector";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

const DAYS: Record<string, number | null> = { "7": 7, "30": 30, alt: null };

export default async function MoneyPage(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const period = typeof sp.p === "string" && sp.p in DAYS ? sp.p : "30";
  const days = DAYS[period];

  const sb = readClient();

  let series = sb
    .from("snapshots")
    .select("id, created_at, total_usd, values, balances, env")
    .order("created_at", { ascending: true });
  if (days !== null) {
    series = series.gte("created_at", sinceIso(days));
  }

  const [{ data: snaps }, { data: cfg }] = await Promise.all([
    series,
    sb.from("trader_config").select("*").eq("id", 1).single(),
  ]);

  const snapshots = (snaps ?? []) as Snapshot[];
  const config = cfg as TraderConfig | null;
  const latest = snapshots.length ? snapshots[snapshots.length - 1] : null;

  if (!latest) {
    return (
      <div className="py-16 text-center text-muted">
        Ingen porteføljedata ennå. Agenten skriver et snapshot ved neste syklus.
      </div>
    );
  }

  const cash = cashOf(latest);
  const invested = investedOf(latest);
  const p = pnl(snapshots);
  const rows = assetBreakdown(latest);
  const points = snapshots
    .filter((s) => s.total_usd > 0)
    .map((s) => ({ t: s.created_at, usd: s.total_usd }));

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Portefølje</h1>
          <p className="text-sm text-muted">Oppdatert {fmtRelative(latest.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={latest.env === "live" ? "warning" : "muted"}>
            {latest.env === "live" ? "LIVE" : "paper"}
          </Badge>
          {config?.kill_switch && <Badge tone="negative">kill switch</Badge>}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <StatTile
            label="Total portefølje"
            value={fmtUsd(latest.total_usd)}
            sub={p ? `${fmtUsd(p.abs)} · ${fmtPct(p.pct)} i perioden` : undefined}
            tone={p ? (p.abs >= 0 ? "positive" : "negative") : "default"}
            large
          />
        </div>
        <StatTile label="Cash" value={cash !== null ? fmtUsd(cash) : "—"} />
        <StatTile label="Investert" value={invested !== null ? fmtUsd(invested) : "—"} />
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>Verdiutvikling</SectionTitle>
          <PeriodSelector base="/" active={period} />
        </div>
        <PnlChart data={points} baseline={p?.first} />
      </Card>

      <Card>
        <SectionTitle>Fordeling</SectionTitle>
        {rows ? (
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <PortfolioDonut rows={rows} />
            <AssetBreakdown rows={rows} total={latest.total_usd} />
          </div>
        ) : (
          <p className="text-sm text-muted">
            Dette snapshotet mangler per-asset verdier (lagret før oppgraderingen). Nyere snapshots
            viser full fordeling.
          </p>
        )}
      </Card>
    </div>
  );
}
