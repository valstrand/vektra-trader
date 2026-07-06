"""Supabase: config, beslutningslogg, snapshots."""
from datetime import datetime, timezone

from supabase import create_client

from agent import config

sb = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)


def get_config() -> dict:
    return sb.table("trader_config").select("*").eq("id", 1).single().execute().data


def last_decision_time() -> datetime | None:
    rows = (
        sb.table("decisions")
        .select("created_at")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    if not rows:
        return None
    return datetime.fromisoformat(rows[0]["created_at"])


def trades_today() -> int:
    since = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
    rows = (
        sb.table("decisions")
        .select("id")
        .eq("executed", True)
        .gte("created_at", since)
        .execute()
        .data
    )
    return len(rows)


def recent_decisions(n: int = 10) -> list[dict]:
    return (
        sb.table("decisions")
        .select("created_at, action, pair, amount_usd, analyst_reasoning, risk_verdict, lesson, executed")
        .order("created_at", desc=True)
        .limit(n)
        .execute()
        .data
    )


def log_decision(row: dict) -> None:
    row["env"] = config.TRADING_ENV
    sb.table("decisions").insert(row).execute()


def log_snapshot(total_usd: float, balances: dict) -> None:
    sb.table("snapshots").insert(
        {"env": config.TRADING_ENV, "total_usd": total_usd, "balances": balances}
    ).execute()
