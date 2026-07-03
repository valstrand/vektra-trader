"""Miljøvariabler og kjøretidskonfig."""
import os
from dotenv import load_dotenv

load_dotenv()

BITFINEX_API_KEY = os.environ["BITFINEX_API_KEY"]
BITFINEX_API_SECRET = os.environ["BITFINEX_API_SECRET"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TRADING_ENV = os.getenv("TRADING_ENV", "paper")

CLAUDE_MODEL = "claude-sonnet-4-6"
