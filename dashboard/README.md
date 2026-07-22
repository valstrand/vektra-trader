# Vektra Dashboard

Next.js 16 (App Router) PWA på toppen av Vektra-agenten. Leser Supabase
read-only via anon-nøkkel; admin skriver til `trader_config` via service role
på serversiden. Deployes separat på Vercel — deler kun Supabase med agenten.

## Sider
- `/` — Penger: total/cash/investert, P&L-kurve, portefølje-fordeling.
- `/agenter` — Analytiker, Risikosjef og Lærer: markedssyn + hva de har lært.
- `/logg` — Beslutningslogg med begrunnelser.
- `/admin` — Risikoprofil, rammer og kill switch (bak passord).

## Oppsett lokalt
```bash
cd dashboard
pnpm install
cp .env.example .env.local     # fyll inn (se under)
pnpm dev                       # http://localhost:3000
```

### Miljøvariabler (`.env.local`)
| Variabel | Hvor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API (samme som agentens `SUPABASE_URL`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → **anon public** |
| `SUPABASE_SERVICE_ROLE_KEY` | Samme som agenten bruker. **Kun server-side.** |
| `ADMIN_PASSWORD` | Velg selv — passord for `/admin` |
| `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` |

## Supabase: skru på Realtime
For at nye beslutninger skal dukke opp live: Supabase → Database → Replication →
legg `decisions` og `snapshots` til i `supabase_realtime`-publikasjonen.

## Deploy til Vercel
1. Importer repoet i Vercel.
2. **Root Directory:** `dashboard/`.
3. Framework: Next.js (auto). Build: `next build`.
4. Legg inn de fem miljøvariablene (over) under Settings → Environment Variables.
   `SUPABASE_SERVICE_ROLE_KEY` behandles som hemmelig — aldri `NEXT_PUBLIC`.
5. (Valgfritt) Ignored Build Step, så commits som kun rører `agent/` ikke
   trigger web-bygg: `git diff --quiet HEAD^ HEAD -- dashboard/`.

## PWA
Manifest + service worker + ikoner er på plass. På telefon: åpne siden i
nettleseren → «Legg til på hjemskjerm». Service worker registreres kun i
produksjon.

## Merk
Dette er UI. Sannheten for risikohåndhevingen bor i `agent/risk.py` — admin
skriver kun til `trader_config`, koden bestemmer.
