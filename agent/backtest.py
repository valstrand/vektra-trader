"""Backtest-harness: spill av historisk OHLCV gjennom én eller flere strategier,
simuler handler, og sammenlign resultatene epler-mot-epler.

Rører verken den kjørende agenten eller databasen — alt skjer i minnet og
skrives kun til terminalen. Bruker de samme rollene (brain.py) og harde
sjekkene (risk.py) som produksjon, så en strategi oppfører seg likt her og live.

    # Sammenlign tre strategier over 30 dager, beslutning hver 24. time:
    uv run python -m agent.backtest --days 30 --cycle-hours 24 \
        --strategies default,momentum,kontrarian

    # Rask røyktest:
    uv run python -m agent.backtest --days 14 --cycle-hours 24 --strategies default

Merk: hver simulert syklus koster to Claude-kall (analytiker + risikosjef).
Antall kall ≈ strategier × sykluser × 2 — skript-et skriver estimatet før start.
"""
import argparse
import json
import sys
from datetime import UTC, datetime

from agent import brain, exchange, risk

WARMUP = 42  # candles kontekst (≈1 uke 4h) før første beslutning
CANDLE_TF = "4h"
CANDLE_MS = 4 * 3600 * 1000


class BacktestAborted(RuntimeError):
    """Uopprettelig feil (tom konto, ugyldig nøkkel) — hele kjøringen stoppes."""


def _is_fatal(e: Exception) -> bool:
    msg = str(e).lower()
    return any(s in msg for s in ("credit balance", "authentication", "invalid x-api-key", "permission"))


def fetch_history(pairs: list[str], days: int) -> dict[str, list[list]]:
    """Hent 4h-candles for hvert par over [nå-(days+warmup), nå]."""
    span_ms = (days + WARMUP // 6 + 2) * 24 * 3600 * 1000
    since = exchange.ex.milliseconds() - span_ms
    out: dict[str, list[list]] = {}
    for pair in pairs:
        out[pair] = exchange.ex.fetch_ohlcv(pair, CANDLE_TF, since=since, limit=1000)
    return out


class Sim:
    """Enkel spot-portefølje: cash + posisjoner, med taker-fee på hver fill."""

    def __init__(self, cash: float, fee: float):
        self.cash = cash
        self.pos: dict[str, float] = {}  # base-symbol -> mengde
        self.fee = fee
        self.trades = 0

    def buy(self, base: str, usd: float, price: float) -> bool:
        usd = min(usd, self.cash)
        if usd <= 0 or price <= 0:
            return False
        self.cash -= usd
        self.pos[base] = self.pos.get(base, 0.0) + (usd * (1 - self.fee)) / price
        self.trades += 1
        return True

    def sell(self, base: str, usd: float, price: float) -> bool:
        held = self.pos.get(base, 0.0)
        amt = min(usd / price, held) if price > 0 else 0.0
        if amt <= 0:
            return False
        self.cash += amt * price * (1 - self.fee)
        self.pos[base] = held - amt
        self.trades += 1
        return True

    def value(self, prices: dict[str, float]) -> float:
        return self.cash + sum(amt * prices.get(b, 0.0) for b, amt in self.pos.items())


def _price_at(candles: list[list], t: int) -> float | None:
    """Close for siste candle med ts <= t."""
    price = None
    for c in candles:
        if c[0] <= t:
            price = c[4]
        else:
            break
    return price


def _context_candles(candles: list[list], t: int, n: int = WARMUP) -> list[list]:
    upto = [c for c in candles if c[0] <= t]
    return upto[-n:]


def build_context(t: int, pairs: list[str], hist: dict, sim: Sim, recent: list[dict]) -> tuple[str, float, dict]:
    prices = {p: (_price_at(hist[p], t) or 0.0) for p in pairs}
    balances: dict[str, float] = {"USD": round(sim.cash, 2)}
    values: dict[str, float] = {"USD": round(sim.cash, 2)}
    for p in pairs:
        base = p.split("/")[0]
        amt = sim.pos.get(base, 0.0)
        if amt > 0:
            balances[base] = amt
            values[base] = amt * prices[p]
    total = sim.value({p.split("/")[0]: prices[p] for p in pairs})

    lines = [
        f"TIDSPUNKT: {datetime.fromtimestamp(t / 1000, UTC).isoformat()}",
        f"PORTEFØLJE (total {total:.2f} USD): {json.dumps(values)}",
        f"BALANSER: {json.dumps(balances)}",
        "",
        "MARKEDSDATA (OHLCV, 4h-candles, eldste først):",
    ]
    for p in pairs:
        lines.append(f"\n{p}: {json.dumps(_context_candles(hist[p], t))}")
    lines += ["", "DINE SISTE BESLUTNINGER (nyeste først):", json.dumps(recent[-10:][::-1], ensure_ascii=False)]
    return "\n".join(lines), total, prices


def run_strategy(strategy: str, pairs: list[str], hist: dict, spine: list[int], step: int, cfg: dict, cash: float, fee: float) -> dict:
    sim = Sim(cash, fee)
    recent: list[dict] = []
    curve: list[float] = []
    holds = 0
    skipped = 0
    executed_at: list[int] = []  # timestamps for utførte trades (for dagskvote)

    steps = list(range(WARMUP, len(spine), step))
    for n, i in enumerate(steps):
        t = spine[i]
        context, total, prices = build_context(t, pairs, hist, sim, recent)

        pf_ctx = (
            f"Total portefølje: {total:.2f} USD. Rammer: maks {cfg['max_position_pct']}% per trade, "
            f"maks {cfg['max_trades_per_day']} trades/dag, tillatte par: {pairs}."
        )
        try:
            proposal = brain.analyst(context, strategy=strategy)
            verdict = brain.risk_officer(proposal, pf_ctx, strategy=strategy)
        except Exception as e:
            if _is_fatal(e):
                # Tom konto / auth-feil: meningsløst å fortsette — avbryt hele kjøringen
                # heller enn å produsere en tabell full av "hold" som ser ekte ut.
                raise BacktestAborted(str(e)) from e
            skipped += 1
            holds += 1
            curve.append(sim.value(prices_by_base(prices)))
            print(f"  [{strategy}] {n + 1}/{len(steps)}  hoppet over ({type(e).__name__})", flush=True)
            continue

        action = proposal["action"]
        amount = proposal["amount_usd"]
        if verdict["verdict"] == "reject":
            action = "hold"
        elif verdict["verdict"] == "reduce" and verdict["adjusted_amount_usd"]:
            amount = verdict["adjusted_amount_usd"]

        day_start = datetime.fromtimestamp(t / 1000, UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        trades_today = sum(1 for ts in executed_at if ts >= int(day_start.timestamp() * 1000))
        ok, _ = risk.check(action, proposal["pair"], amount, cfg, total, trades_today)

        executed = False
        if ok and action in ("buy", "sell"):
            pair = proposal["pair"]
            base = pair.split("/")[0]
            price = prices.get(pair, 0.0)
            executed = sim.buy(base, amount, price) if action == "buy" else sim.sell(base, amount, price)
            if executed:
                executed_at.append(t)
        if action == "hold":
            holds += 1

        recent.append(
            {
                "created_at": datetime.fromtimestamp(t / 1000, UTC).isoformat(),
                "action": action,
                "pair": proposal["pair"],
                "amount_usd": amount,
                "analyst_reasoning": proposal["reasoning"][:400],
                "risk_verdict": verdict["verdict"],
                "lesson": proposal["lesson"],
                "executed": executed,
            }
        )
        curve.append(sim.value(prices_by_base(prices)))
        print(f"  [{strategy}] {n + 1}/{len(steps)}  {datetime.fromtimestamp(t/1000, UTC).date()}  "
              f"{action:4} {proposal['pair'] or ''!s:9}  verdi {curve[-1]:.2f}", flush=True)

    peak = curve[0] if curve else cash
    max_dd = 0.0
    for v in curve:
        peak = max(peak, v)
        max_dd = min(max_dd, (v - peak) / peak * 100)
    final = curve[-1] if curve else cash
    return {
        "strategy": strategy,
        "final": final,
        "pnl_pct": (final - cash) / cash * 100,
        "trades": sim.trades,
        "steps": len(steps),
        "skipped": skipped,
        "hold_pct": holds / len(steps) * 100 if steps else 0.0,
        "max_dd": max_dd,
    }


def prices_by_base(prices_by_pair: dict[str, float]) -> dict[str, float]:
    return {p.split("/")[0]: v for p, v in prices_by_pair.items()}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=30)
    ap.add_argument("--cycle-hours", type=int, default=24)
    ap.add_argument("--pairs", default="BTC/USD,ETH/USD,LTC/USD,SOL/USD")
    ap.add_argument("--strategies", default="default,momentum,kontrarian")
    ap.add_argument("--cash", type=float, default=400.0)
    ap.add_argument("--fee", type=float, default=0.002)
    ap.add_argument("--max-position-pct", type=float, default=25.0)
    ap.add_argument("--max-trades-per-day", type=int, default=2)
    args = ap.parse_args()

    pairs = [p.strip() for p in args.pairs.split(",") if p.strip()]
    strategies = [s.strip() for s in args.strategies.split(",") if s.strip()]
    step = max(1, args.cycle_hours * 3600 * 1000 // CANDLE_MS)

    print(f"Henter {args.days}d historikk for {pairs} …", flush=True)
    hist = fetch_history(pairs, args.days)
    spine = [c[0] for c in hist[pairs[0]]]
    n_steps = len(range(WARMUP, len(spine), step))
    if n_steps < 1:
        print("For kort periode for gitt kadens — øk --days eller senk --cycle-hours.")
        sys.exit(1)
    print(f"{len(spine)} candles, {n_steps} beslutninger per strategi. "
          f"≈ {len(strategies) * n_steps * 2} Claude-kall totalt.\n", flush=True)

    cfg = {
        "kill_switch": False,
        "allowed_pairs": pairs,
        "min_order_usd": 10,
        "max_position_pct": args.max_position_pct,
        "max_trades_per_day": args.max_trades_per_day,
    }

    results = []
    try:
        for s in strategies:
            print(f"=== Strategi: {s} ===", flush=True)
            results.append(run_strategy(s, pairs, hist, spine, step, cfg, args.cash, args.fee))
    except BacktestAborted as e:
        print(f"\nAVBRUTT: {e}")
        print("Uopprettelig API-feil (sannsynligvis tom Anthropic-konto). "
              "Fyll på kreditt og kjør igjen.", flush=True)
        sys.exit(1)

    results.sort(key=lambda r: r["final"], reverse=True)
    valid = [r for r in results if r["skipped"] == 0]
    print("\n" + "=" * 74)
    print(f"RESULTAT ({args.days}d, {n_steps} beslutninger, start {args.cash:.0f} USD, fee {args.fee*100:.1f}%)")
    print("=" * 74)
    print(f"{'STRATEGI':<14}{'SLUTT':>10}{'P&L':>9}{'TRADES':>8}{'MAKS-DD':>9}{'HOLD%':>7}{'HOPPET':>8}")
    for r in results:
        flag = "  ⚠ ugyldig" if r["skipped"] else ""
        print(f"{r['strategy']:<14}{r['final']:>10.2f}{r['pnl_pct']:>8.2f}%{r['trades']:>8}"
              f"{r['max_dd']:>8.1f}%{r['hold_pct']:>6.0f}%{r['skipped']:>8}{flag}")
    print("=" * 74)
    if valid:
        print(f"Vinner (av gyldige): {valid[0]['strategy']}  ({valid[0]['pnl_pct']:+.2f}%)")
    if len(valid) < len(results):
        print("⚠ Rader med hoppede steg er ufullstendige — kjør dem på nytt for et gyldig resultat.")


if __name__ == "__main__":
    main()
