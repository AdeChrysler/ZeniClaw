#!/bin/sh

OPENCLAW_HOME=/home/node/.openclaw
INIT_DONE="$OPENCLAW_HOME/.zeniclaw-initialized"

# Ensure persistent data dirs exist (these are volume-mounted)
mkdir -p "$OPENCLAW_HOME/sessions" "$OPENCLAW_HOME/agents" "$OPENCLAW_HOME/workspace"

# Background init on first boot only — runs AFTER gateway starts
if [ ! -f "$INIT_DONE" ]; then
  echo "[openclaw-start] First boot — scheduling plugin init in background..."
  (
    sleep 30
    echo "[openclaw-init] Installing @openclaw/whatsapp..."
    openclaw plugins install @openclaw/whatsapp 2>&1 || echo "[openclaw-init] whatsapp plugin unavailable (non-fatal)"
    echo "[openclaw-init] Installing @openclaw/telegram..."
    openclaw plugins install @openclaw/telegram 2>&1 || echo "[openclaw-init] telegram plugin unavailable (non-fatal)"
    echo "[openclaw-init] Registering CEO assistant agent..."
    openclaw agents add ceo-assistant 2>&1 || echo "[openclaw-init] agent add skipped (non-fatal)"
    touch "$INIT_DONE"
    echo "[openclaw-init] First-boot init complete."
  ) &
fi

echo "[openclaw-start] Starting OpenClaw gateway on port 18789..."
exec openclaw gateway --port 18789 --verbose --allow-unconfigured
