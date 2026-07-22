import "server-only";
import { createClient } from "@supabase/supabase-js";

// Lese-klient (anon) for Server Components. Ingen sesjon/cookies — kun offentlig lesing.
export function readClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}

// Service-role-klient for admin-SKRIVING. Omgår RLS. Brukes KUN i server actions.
// Filen er merket server-only, så en utilsiktet klient-import feiler ved bygg.
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
