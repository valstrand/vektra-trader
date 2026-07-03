# Dashboard-spec — bygg med Claude Code når agenten kjører

Next.js (App Router) + Supabase på Vercel. Samme stack som Furunes.
Eget repo eller `dashboard/`-mappe — valgfritt.

## To flater
1. **Offentlig** (`/`) — read-only via anon-nøkkel (RLS er allerede satt opp):
   - P&L-kurve fra `snapshots.total_usd` over tid, med startstrek på innskudd
   - Nåværende portefølje (siste snapshot, `balances` som donut/tabell)
   - Beslutningslogg: tidslinje med action/pair/beløp, analytikerens og
     risikosjefens begrunnelse, confidence, lesson. Dette er hovedattraksjonen.
   - Siste ukesrefleksjon fra `reflections`
   - Badge: env (paper/live) + kill switch-status
2. **Admin** (`/admin`) — enkel auth (Supabase Auth eller basic password):
   - Toggle kill_switch
   - Juster cycle_hours, max_position_pct, max_trades_per_day, allowed_pairs
   - Skriver til trader_config via service role (server action / route handler
     — aldri eksponer service role i klienten)

## Design
Rolig og redaksjonelt — dette skal deles på LinkedIn. Norsk språk.
Mørk bakgrunn, én aksentfarge, tydelig typografisk hierarki.
Recharts eller lignende for kurvene. Mobil først — det leses fra sofaen.

## Realtime
Supabase Realtime på decisions/snapshots så nye beslutninger dukker opp live.
