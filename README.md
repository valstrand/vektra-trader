# Vektra Trader

Autonom LLM-basert tradingagent mot Bitfinex. Claude (Sonnet) tar beslutninger,
Python eksekverer, Supabase husker alt, Hetzner kjører døgnet rundt.

> Dette er et eksperiment. Agenten kan tape alt. Ikke sett inn penger du ikke
> har råd til å miste.

## Arkitektur

```
systemd timer (hvert 15. min, Hetzner)
  └── agent/main.py
        1. Les config fra Supabase (kill switch? tid for ny syklus?)
        2. Hent markedsdata + balanser (ccxt → Bitfinex)
        3. Claude-kall 1: Analytiker  → forslag (strukturert JSON)
        4. Claude-kall 2: Risikosjef  → godkjenn / nedskaler / avvis
        5. Harde risikosjekker i kode (risk.py) — koden har alltid siste ord
        6. Eksekver ordre (ccxt)
        7. Logg beslutning + porteføljesnapshot til Supabase
```

## Oppsett steg for steg

### 1. Bitfinex (gjøres i nettleseren, av deg)
1. Logg inn, sjekk at kontoen er OK (KYC/2FA).
2. Sub-Accounts → opprett en **Paper Trading**-sub-konto.
3. Lag API-nøkkel på paper-kontoen: **read + orders**. ALDRI withdraw.
4. Noter key + secret.

### 2. Supabase
1. Opprett nytt prosjekt (eller bruk eksisterende).
2. Kjør `supabase/schema.sql` i SQL Editor.
3. Noter `SUPABASE_URL` og `service_role`-nøkkelen (agenten skriver, så den
   trenger service role — dashboardet bruker anon-nøkkelen, read-only).

### 3. Lokalt (Cursor / Claude Code)
```bash
git clone <ditt-repo> && cd vektra-trader
# opprett .env med nøklene dine (se «Miljøvariabler» under)
uv sync                     # installerer alt fra pyproject.toml
uv run python -m agent.main --dry-run   # full syklus uten ordre
```

#### Miljøvariabler (`.env`)
Opprett en `.env`-fil i prosjektroten (den er gitignored — commit den aldri):
```dotenv
# Bitfinex — nøkkel fra PAPER TRADING sub-kontoen.
# Rettigheter: read + orders. ALDRI withdraw.
BITFINEX_API_KEY=
BITFINEX_API_SECRET=

# Anthropic
ANTHROPIC_API_KEY=

# Supabase (service role — agenten skriver til databasen)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Miljø: "paper" eller "live" — kun til merking i loggene
TRADING_ENV=paper
```

### 4. Hetzner
```bash
# på serveren
curl -LsSf https://astral.sh/uv/install.sh | sh
git clone <ditt-repo> /opt/vektra-trader
cd /opt/vektra-trader
# opprett .env med nøklene dine (se «Miljøvariabler» over)
uv sync
uv run python -m agent.main --dry-run          # verifiser

sudo cp deploy/vektra-trader.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now vektra-trader.timer
journalctl -u vektra-trader -f                 # følg med live
```

### 5. Fra paper til ekte penger
Når du er fornøyd etter 2–3 uker på paper: lag ny API-nøkkel på hovedkontoen
(read + orders, aldri withdraw), bytt i `.env`, restart. Ingen kodeendring.

## Styring i drift
Alt styres fra `config`-tabellen i Supabase (eller dashboardet senere):
- `kill_switch = true`  → agenten gjør ingenting
- `cycle_hours`         → hvor ofte agenten tar beslutning
- `max_position_pct`, `max_trades_per_day`, `allowed_pairs` → risikorammer

## Lærer-rollen (ukentlig refleksjon)
Leser beslutningsloggen + P&L for perioden og skriver en ærlig refleksjon til
`reflections`-tabellen, med maks 1–2 forslag til endringer i `strategi.md`. Den
**endrer aldri strategien selv** — du vurderer forslagene og committer manuelt.

```bash
uv run python -m agent.teacher --dry-run   # skriv ikke til Supabase
uv run python -m agent.teacher             # siste 7 dager, lagrer
uv run python -m agent.teacher --days 14
```

Automatisk hver mandag (som root, samme mønster som hovedtimeren):
```bash
cp deploy/vektra-trader-teacher.{service,timer} /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now vektra-trader-teacher.timer
```

## Struktur
```
agent/       Python-koden (main, exchange, brain, risk, db, config)
prompts/     Agentens "personlighet" — rediger disse, ikke koden
supabase/    schema.sql
deploy/      systemd-filer + deploy-skript
docs/        DASHBOARD.md — spec for Next.js-dashboardet (bygg med Claude Code)
CLAUDE.md    Kontekst for Claude Code når du bygger videre
```
