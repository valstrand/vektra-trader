"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

// Abonnerer på nye beslutninger/snapshots og re-henter server-komponentene.
// Krever at Realtime er skrudd på for tabellene i Supabase (Database → Replication).
export function RealtimeRefresh() {
  const router = useRouter();
  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel("vektra-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "decisions" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "snapshots" },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [router]);
  return null;
}
