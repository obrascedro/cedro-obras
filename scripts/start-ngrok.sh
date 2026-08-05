#!/usr/bin/env bash
# Expõe o servidor local para a Meta validar o webhook.
# Pré-requisito: npx ngrok config add-authtoken SEU_TOKEN
set -euo pipefail
PORT="${CEDRO_DEV_PORT:-3001}"
echo "Iniciando ngrok na porta ${PORT}..."
echo "Webhook URL: https://SEU_SUBDOMINIO.ngrok-free.app/api/webhooks/whatsapp"
exec npx ngrok http "$PORT"
