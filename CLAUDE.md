# CLAUDE.md — kontekst for Claude Code

Autonom tradingagent mot Bitfinex. Claude Sonnet tar beslutninger via to
sekvensielle roller (analytiker → risikosjef), Python eksekverer via ccxt,
Supabase er hukommelse og styringsflate, systemd-timer på Hetzner kjører det.

## Arkitekturprinsipper (ikke bryt disse)
1. **Harde risikosjekker bor i `agent/risk.py`, aldri i prompter.** LLM-en
   foreslår; koden bestemmer. Nye grenser legges i trader_config + risk.py.
2. **Strategien bor i `prompts/*.md`, aldri i Python.** Adferdsendringer skal
   være prompt-diffs, ikke kodeendringer.
3. **All styring i drift skjer via `trader_config` i Supabase** (kill switch,
   frekvens, rammer) — ikke via kodeendringer eller miljøvariabler.
4. **API-nøkler har aldri withdraw-rettighet.** Ikke skriv kode som flytter
   midler ut av børsen.
5. Strukturert output fra Claude bruker `output_config` (GA) med JSON-skjema —
   ikke prompt-basert "svar kun med JSON".

## Verktøy og konvensjoner
- Python 3.12+, uv (`uv sync`, `uv run`, `uv add <pkg>`)
- Lint: `uvx ruff check .` / format: `uvx ruff format .`
- Test lokalt: `uv run python -m agent.main --dry-run`
- Norsk i prompter, logger og domenebegreper; engelsk i kodeidentifikatorer.

## Kjente skarpe kanter
- Bitfinex bruker significant digits-presisjon; bruk alltid
  `ex.amount_to_precision()` før ordre (gjøres i exchange.py).
- Bitfinex "USD"-par kan være USDT under panseret; ccxt normaliserer.
- Paper trading-kontoen støtter ikke alle par — sjekk allowed_pairs mot det
  som faktisk finnes på paper-kontoen.
- supabase-py `.single()` kaster hvis raden mangler; trader_config-raden
  seedes av schema.sql.

## Videre arbeid (roadmap)
- [x] Dashboard (Next.js PWA på Vercel) — se `dashboard/` og docs/DASHBOARD.md
- [x] Lærer-rollen: ukentlig refleksjon → reflections-tabellen
      (`agent/teacher.py`, kjøres av vektra-trader-teacher.timer)
- [ ] Daglig oppsummering på norsk (Slack/e-post)

## Dashboard (dashboard/)
Next.js 16 PWA. Egen sub-app, deployes på Vercel (root directory = dashboard/),
deler kun Supabase. Leser via anon-nøkkel (RLS read-only); admin skriver til
trader_config via service role i server actions (aldri i klienten). Se
dashboard/README.md. NB: penge-siden bruker snapshots.values (per-asset USD).
