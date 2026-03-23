#!/bin/sh

OPENCLAW_HOME=/home/node/.openclaw
INIT_DONE="$OPENCLAW_HOME/.initialized"

# Ensure config directories exist (quick)
mkdir -p "$OPENCLAW_HOME/workspace/skills"
mkdir -p "$OPENCLAW_HOME/agents"

# Always refresh config and skills from image (quick — these are small files)
if [ -f "/openclaw-static/openclaw.json" ]; then
  cp /openclaw-static/openclaw.json "$OPENCLAW_HOME/openclaw.json"
  echo "[openclaw-start] Config applied."
fi

if [ -d "/openclaw-static/skills" ]; then
  cp -r /openclaw-static/skills/. "$OPENCLAW_HOME/workspace/skills/"
  echo "[openclaw-start] Skills applied."
fi

# Background initialization on first boot only
# Plugin installation happens AFTER gateway starts to avoid blocking health check
if [ ! -f "$INIT_DONE" ]; then
  echo "[openclaw-start] First boot detected — plugin init scheduled in background."
  (
    # Wait for gateway to be responsive
    sleep 25
    echo "[openclaw-init] Installing @openclaw/whatsapp plugin..."
    openclaw plugins install @openclaw/whatsapp 2>&1 || echo "[openclaw-init] WhatsApp plugin install failed (non-fatal)"

    echo "[openclaw-init] Installing @openclaw/telegram plugin..."
    openclaw plugins install @openclaw/telegram 2>&1 || echo "[openclaw-init] Telegram plugin install failed (non-fatal)"

    echo "[openclaw-init] Registering CEO assistant agent..."
    openclaw agents add ceo-assistant 2>&1 || echo "[openclaw-init] CEO agent add failed (non-fatal)"

    touch "$INIT_DONE"
    echo "[openclaw-init] First-boot initialization complete."
  ) &
fi

echo "[openclaw-start] Starting OpenClaw gateway on port 18789..."
exec openclaw gateway --port 18789 --verbose --allow-unconfigured
