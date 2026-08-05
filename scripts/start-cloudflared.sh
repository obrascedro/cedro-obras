#!/usr/bin/env bash
# Túnel público gratuito (sem conta) — alternativa ao ngrok.
# Uso: bash scripts/start-cloudflared.sh
set -euo pipefail
PORT="${CEDRO_DEV_PORT:-3001}"
echo "Expondo http://127.0.0.1:${PORT} via Cloudflare Tunnel..."
echo "Copie a URL https://....trycloudflare.com e use:"
echo "  https://....trycloudflare.com/api/webhooks/whatsapp"
exec npx cloudflared tunnel --url "http://127.0.0.1:${PORT}"
