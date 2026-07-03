#!/usr/bin/env bash
# Enkel deploy: kjøres på Hetzner-serveren etter git push.
set -euo pipefail
cd /opt/vektra-trader
git pull
uv sync --frozen
echo "Deployet $(git rev-parse --short HEAD). Neste timer-kjøring plukker opp endringene."
