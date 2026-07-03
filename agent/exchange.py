"""Bitfinex via ccxt. Kun read + orders — aldri withdraw."""
import ccxt

from agent import config

ex = ccxt.bitfinex(
    {
        "apiKey": config.BITFINEX_API_KEY,
        "secret": config.BITFINEX_API_SECRET,
        "enableRateLimit": True,
    }
)
ex.load_markets()


def balances() -> dict[str, float]:
    """Ikke-null balanser, f.eks. {'BTC': 0.001, 'USD': 120.5}."""
    raw = ex.fetch_balance()
    return {k: v for k, v in raw["total"].items() if v and v > 0}


def ticker_price(pair: str) -> float:
    return float(ex.fetch_ticker(pair)["last"])


def portfolio_usd(bals: dict[str, float]) -> tuple[float, dict[str, float]]:
    """Total USD-verdi + verdi per valuta."""
    values: dict[str, float] = {}
    for cur, amt in bals.items():
        if cur in ("USD", "UST", "USDT"):
            values[cur] = amt
            continue
        try:
            values[cur] = amt * ticker_price(f"{cur}/USD")
        except Exception:
            values[cur] = 0.0  # ukjent/illikvid — teller som 0, logges uansett
    return sum(values.values()), values


def ohlcv(pair: str, timeframe: str = "4h", limit: int = 50) -> list[list]:
    """[[ts, open, high, low, close, volume], ...] — mates rått til Claude."""
    return ex.fetch_ohlcv(pair, timeframe=timeframe, limit=limit)


def market_order(pair: str, side: str, amount_usd: float) -> dict:
    """Market-ordre målt i USD; ccxt håndterer Bitfinex' presisjonsregler."""
    price = ticker_price(pair)
    amount = ex.amount_to_precision(pair, amount_usd / price)
    return ex.create_order(pair, "market", side, float(amount))
