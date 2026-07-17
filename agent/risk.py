"""Harde risikosjekker. Claude foreslår — denne koden bestemmer om det er lov.

Alle sjekker returnerer (ok: bool, reason: str). Første som feiler stopper trade.
"""


def check(
    action: str,
    pair: str | None,
    amount_usd: float | None,
    cfg: dict,
    total_usd: float,
    trades_today: int,
) -> tuple[bool, str]:
    if action == "hold":
        return True, "hold — ingen sjekker nødvendig"

    if cfg["kill_switch"]:
        return False, "kill switch er aktiv"

    if not pair or pair not in cfg["allowed_pairs"]:
        return False, f"paret {pair!r} er ikke i allowed_pairs"

    if amount_usd is None or amount_usd <= 0:
        return False, "amount_usd mangler eller er ugyldig"

    if amount_usd < cfg["min_order_usd"]:
        return False, f"ordre ({amount_usd:.2f} USD) under minimum ({cfg['min_order_usd']})"

    # Kjøp-spesifikke tak: posisjonsstørrelse og dagskvote. Begge gjelder KUN
    # kjøp. Et salg reduserer eksponering og skal aldri stoppes av dem — ellers
    # blir en posisjon større enn taket umulig å eksitere, og en tvungen exit
    # kan blokkeres av aktivitetsgrensen. Børsen avviser uansett oversalg.
    if action == "buy":
        max_usd = total_usd * cfg["max_position_pct"] / 100
        if amount_usd > max_usd:
            return False, f"ordre ({amount_usd:.2f} USD) over maks {cfg['max_position_pct']}% ({max_usd:.2f} USD)"

        if trades_today >= cfg["max_trades_per_day"]:
            return False, f"dagens kvote brukt opp ({trades_today}/{cfg['max_trades_per_day']})"

    return True, "godkjent av harde sjekker"
