"""Én syklus: kontekst → analytiker → risikosjef → harde sjekker → eksekver → logg.

Kjøres av systemd-timer hvert 15. min. Selve beslutningsfrekvensen styres av
cycle_hours i Supabase — de fleste kjøringer avsluttes umiddelbart.

    uv run python -m agent.main            # normal kjøring
    uv run python -m agent.main --dry-run  # full syklus, men ingen ordre
"""
import json
import sys
from datetime import datetime, timezone

from agent import brain, db, exchange, risk


def build_market_context(cfg: dict) -> tuple[str, float, dict, dict]:
    bals = exchange.balances()
    total_usd, values = exchange.portfolio_usd(bals)

    lines = [
        f"TIDSPUNKT: {datetime.now(timezone.utc).isoformat()}",
        f"PORTEFØLJE (total {total_usd:.2f} USD): {json.dumps(values)}",
        f"BALANSER: {json.dumps(bals)}",
        "",
        "MARKEDSDATA (OHLCV, 4h-candles, eldste først):",
    ]
    for pair in cfg["allowed_pairs"]:
        try:
            candles = exchange.ohlcv(pair, "4h", 42)  # ~1 uke
            lines.append(f"\n{pair}: {json.dumps(candles)}")
        except Exception as e:
            lines.append(f"\n{pair}: FEIL ({e})")

    recent = db.recent_decisions(10)
    lines += ["", "DINE SISTE BESLUTNINGER (nyeste først):", json.dumps(recent, ensure_ascii=False)]
    return "\n".join(lines), total_usd, bals, values


def run(dry_run: bool = False) -> None:
    cfg = db.get_config()

    if cfg["kill_switch"]:
        print("kill switch aktiv — avslutter")
        return

    last = db.last_decision_time()
    if last is not None:
        hours_since = (datetime.now(timezone.utc) - last).total_seconds() / 3600
        if hours_since < float(cfg["cycle_hours"]):
            print(f"kun {hours_since:.1f}t siden forrige syklus (< {cfg['cycle_hours']}t) — venter")
            return

    context, total_usd, bals, values = build_market_context(cfg)
    db.log_snapshot(total_usd, bals, values)

    proposal = brain.analyst(context)
    print("ANALYTIKER:", json.dumps(proposal, ensure_ascii=False))

    portfolio_ctx = (
        f"Total portefølje: {total_usd:.2f} USD. "
        f"Rammer: maks {cfg['max_position_pct']}% per trade, "
        f"maks {cfg['max_trades_per_day']} trades/dag ({db.trades_today()} brukt), "
        f"tillatte par: {cfg['allowed_pairs']}."
    )
    verdict = brain.risk_officer(proposal, portfolio_ctx)
    print("RISIKOSJEF:", json.dumps(verdict, ensure_ascii=False))

    action = proposal["action"]
    amount = proposal["amount_usd"]
    if verdict["verdict"] == "reject":
        action = "hold"
    elif verdict["verdict"] == "reduce" and verdict["adjusted_amount_usd"]:
        amount = verdict["adjusted_amount_usd"]

    ok, reason = risk.check(action, proposal["pair"], amount, cfg, total_usd, db.trades_today())
    print("HARDE SJEKKER:", ok, "—", reason)

    executed = False
    order_id = None
    error = None
    if ok and action in ("buy", "sell"):
        if dry_run:
            print(f"DRY RUN: ville sendt {action} {amount:.2f} USD i {proposal['pair']}")
        else:
            try:
                order = exchange.market_order(proposal["pair"], action, amount)
                order_id = str(order.get("id"))
                executed = True
                print("ORDRE SENDT:", order_id)
            except Exception as e:
                error = str(e)
                print("ORDREFEIL:", error)

    db.log_decision(
        {
            "action": action,
            "pair": proposal["pair"],
            "amount_usd": amount,
            "analyst_reasoning": proposal["reasoning"],
            "risk_reasoning": verdict["reasoning"],
            "risk_verdict": verdict["verdict"],
            "confidence": proposal["confidence"],
            "lesson": proposal["lesson"],
            "order_id": order_id,
            "executed": executed,
            "error": error or (None if ok else reason),
        }
    )
    print("syklus ferdig og logget")


if __name__ == "__main__":
    run(dry_run="--dry-run" in sys.argv)
