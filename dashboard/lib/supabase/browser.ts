import { createBrowserClient } from "@supabase/ssr";

// Anon-klient for klientkomponenter og Realtime. RLS gir kun SELECT — trygt i klient.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
