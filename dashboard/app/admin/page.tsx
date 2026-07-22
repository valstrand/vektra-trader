import { readClient } from "@/lib/supabase/server";
import type { TraderConfig } from "@/lib/types";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const sb = readClient();
  const [{ data: cfg }, { data: snap }] = await Promise.all([
    sb.from("trader_config").select("*").eq("id", 1).maybeSingle(),
    sb
      .from("snapshots")
      .select("total_usd")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const config = cfg as TraderConfig | null;
  const totalUsd = (snap as { total_usd: number } | null)?.total_usd ?? null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight">Styring</h1>
        <p className="text-sm text-muted">
          Juster risikoprofil og rammer. Endringene styrer agenten via trader_config —
          koden i risk.py håndhever dem.
        </p>
      </header>
      {config ? (
        <AdminPanel config={config} totalUsd={totalUsd} />
      ) : (
        <p className="text-muted">Fant ingen trader_config-rad.</p>
      )}
    </div>
  );
}
