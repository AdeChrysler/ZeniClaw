#!/bin/sh
set -e

OPENCLAW_HOME=/home/node/.openclaw
INIT_DONE="$OPENCLAW_HOME/.zeniclaw-initialized"

# Ensure persistent data dirs exist (these are volume-mounted)
mkdir -p "$OPENCLAW_HOME/sessions" "$OPENCLAW_HOME/agents" "$OPENCLAW_HOME/workspace"

if [ ! -f "$INIT_DONE" ]; then
  echo "[openclaw-start] First run — running plugin check..."

  # Plugins were installed at image build time.
  # Re-install to named volume if not already there.
  openclaw plugins install @openclaw/whatsapp 2>&1 || echo "[openclaw-start] @openclaw/whatsapp already installed or unavailable"
  openclaw plugins install @openclaw/telegram 2>&1 || echo "[openclaw-start] @openclaw/telegram already installed or unavailable"

  # Add CEO assistant agent
  openclaw agents add ceo-assistant 2>&1 || echo "[openclaw-start] ceo-assistant agent — skipping"

  touch "$INIT_DONE"
  echo "[openclaw-start] Init complete."
fi

echo "[openclaw-start] Starting OpenClaw gateway on port 18789..."
exec openclaw gateway --port 18789 --verbose
