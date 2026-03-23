#!/bin/sh
set -e

OPENCLAW_HOME=/home/node/.openclaw
INIT_DONE="$OPENCLAW_HOME/.initialized"

# Ensure config directories exist
mkdir -p "$OPENCLAW_HOME/workspace/skills"
mkdir -p "$OPENCLAW_HOME/agents"

if [ ! -f "$INIT_DONE" ]; then
  echo "[openclaw-start] First run — initializing OpenClaw..."

  # Copy openclaw.json config into the persistent volume
  if [ -f "/openclaw-static/openclaw.json" ]; then
    cp /openclaw-static/openclaw.json "$OPENCLAW_HOME/openclaw.json"
    echo "[openclaw-start] Copied openclaw.json to config dir."
  fi

  # Copy skills into workspace
  if [ -d "/openclaw-static/skills" ]; then
    cp -r /openclaw-static/skills/. "$OPENCLAW_HOME/workspace/skills/"
    echo "[openclaw-start] Copied skills to workspace."
  fi

  # Install plugins (non-fatal — may already be installed in the image)
  echo "[openclaw-start] Installing WhatsApp plugin..."
  openclaw plugins install @openclaw/whatsapp 2>&1 || echo "[openclaw-start] WhatsApp plugin install skipped (may already be installed)"

  echo "[openclaw-start] Installing Telegram plugin..."
  openclaw plugins install @openclaw/telegram 2>&1 || echo "[openclaw-start] Telegram plugin install skipped (may already be installed)"

  # Add CEO assistant agent
  echo "[openclaw-start] Adding CEO assistant agent..."
  openclaw agents add ceo-assistant 2>&1 || echo "[openclaw-start] CEO assistant agent add skipped"

  touch "$INIT_DONE"
  echo "[openclaw-start] Initialization complete."
fi

echo "[openclaw-start] Starting OpenClaw gateway on port 18789..."
exec openclaw gateway --port 18789 --verbose
