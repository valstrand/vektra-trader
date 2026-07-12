"""Claude-kall: Analytiker → Risikosjef. Strukturert JSON via output_config (GA)."""
import json
from pathlib import Path

from anthropic import Anthropic

from agent import config

client = Anthropic(api_key=config.ANTHROPIC_API_KEY)
PROMPTS = Path(__file__).parent.parent / "prompts"

ANALYST_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "action": {"type": "string", "enum": ["buy", "sell", "hold"]},
        "pair": {"type": ["string", "null"], "description": "F.eks. BTC/USD. null ved hold."},
        "amount_usd": {"type": ["number", "null"]},
        "reasoning": {"type": "string"},
        "confidence": {"type": "number", "description": "Mellom 0 og 1."},
        "lesson": {"type": "string", "description": "Hva jeg ser etter neste gang."},
    },
    "required": ["action", "pair", "amount_usd", "reasoning", "confidence", "lesson"],
}

RISK_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "verdict": {"type": "string", "enum": ["approve", "reduce", "reject"]},
        "adjusted_amount_usd": {"type": ["number", "null"]},
        "reasoning": {"type": "string"},
    },
    "required": ["verdict", "adjusted_amount_usd", "reasoning"],
}

REFLECTION_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "content": {
            "type": "string",
            "description": "Ærlig refleksjon på norsk: hva gikk bra/dårlig, dyktighet vs flaks, mønstre.",
        },
        "suggested_strategy_changes": {
            "type": ["string", "null"],
            "description": "Maks 1–2 konkrete endringer i strategi.md, som limbar tekst. null hvis ingen.",
        },
    },
    "required": ["content", "suggested_strategy_changes"],
}


def _prompt(name: str) -> str:
    return (PROMPTS / name).read_text(encoding="utf-8")


def _call(system: str, user: str, schema: dict, max_tokens: int = 1500) -> dict:
    msg = client.messages.create(
        model=config.CLAUDE_MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
        output_config={"format": {"type": "json_schema", "schema": schema}},
    )
    text = next(b.text for b in msg.content if b.type == "text")
    return json.loads(text)


def analyst(market_context: str) -> dict:
    system = _prompt("strategi.md") + "\n\n" + _prompt("analytiker.md")
    return _call(system, market_context, ANALYST_SCHEMA)


def risk_officer(proposal: dict, portfolio_context: str) -> dict:
    system = _prompt("strategi.md") + "\n\n" + _prompt("risikosjef.md")
    user = (
        f"ANALYTIKERENS FORSLAG:\n{json.dumps(proposal, ensure_ascii=False, indent=2)}\n\n"
        f"PORTEFØLJE OG RAMMER:\n{portfolio_context}"
    )
    return _call(system, user, RISK_SCHEMA)


def teacher(review_context: str) -> dict:
    system = _prompt("strategi.md") + "\n\n" + _prompt("laerer.md")
    return _call(system, review_context, REFLECTION_SCHEMA, max_tokens=2500)
