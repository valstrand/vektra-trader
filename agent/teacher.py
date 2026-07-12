"""Lærer-rollen: refleksjon over beslutningsloggen → reflections-tabellen.

Leser hele beslutningsloggen og porteføljeutviklingen for perioden, ber Claude
skrive en ærlig refleksjon (laerer.md), og lagrer den. Foreslår strategi-
endringer som limbar tekst — eieren vurderer og committer selv. Endrer ALDRI
strategi.md fra kode.

Kjøres manuelt eller av en ukentlig systemd-timer:

    uv run python -m agent.teacher              # siste 7 dager
    uv run python -m agent.teacher --days 14
    uv run python -m agent.teacher --dry-run    # skriv ikke til Supabase
"""
import json
import sys

from agent import brain, db


def build_review_context(days: int) -> str:
    decisions = db.decisions_since(days)
    snapshots = db.snapshots_since(days)

    lines = [
        f"PERIODE: siste {days} dager",
        f"ANTALL BESLUTNINGER: {len(decisions)}",
    ]

    if snapshots:
        start = snapshots[0]["total_usd"]
        end = snapshots[-1]["total_usd"]
        pnl = end - start
        pct = (pnl / start * 100) if start else 0.0
        lines.append(f"P&L: {start:.2f} → {end:.2f} USD ({pnl:+.2f} USD, {pct:+.2f}%)")
    else:
        lines.append("P&L: ingen snapshots i perioden")

    executed = [d for d in decisions if d["executed"]]
    lines.append(f"UTFØRTE TRADES: {len(executed)} av {len(decisions)} beslutninger")

    lines += ["", "BESLUTNINGSLOGG (eldste først):", json.dumps(decisions, ensure_ascii=False, indent=2)]
    lines += [
        "",
        "PORTEFØLJEVERDI OVER TID:",
        json.dumps([{"t": s["created_at"], "usd": s["total_usd"]} for s in snapshots], ensure_ascii=False),
    ]
    return "\n".join(lines)


def run(days: int = 7, dry_run: bool = False) -> None:
    context = build_review_context(days)
    reflection = brain.teacher(context)

    print("REFLEKSJON:\n", reflection["content"])
    print("\nFORESLÅTTE STRATEGIENDRINGER:\n", reflection["suggested_strategy_changes"] or "(ingen)")

    if dry_run:
        print("\nDRY RUN: lagrer ikke til Supabase")
        return

    db.log_reflection(days, reflection["content"], reflection["suggested_strategy_changes"])
    print("\nrefleksjon lagret til reflections")


def _parse_days(argv: list[str]) -> int:
    if "--days" in argv:
        return int(argv[argv.index("--days") + 1])
    return 7


if __name__ == "__main__":
    run(days=_parse_days(sys.argv), dry_run="--dry-run" in sys.argv)
