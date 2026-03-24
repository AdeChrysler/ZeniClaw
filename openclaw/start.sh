#!/bin/sh
# OpenClaw startup with port forwarding for Docker inter-container access.
#
# Problem: 'openclaw gateway --bind lan' crashes in Coolify's Docker environment.
# Solution: Run gateway on loopback:18788 (stable), forward 0.0.0.0:18789 via socat.
# This makes openclaw:18789 reachable from other containers without --bind lan.

echo "[openclaw-start] HOME=$HOME"

# Ensure openclaw dirs exist (volumes mount sessions/ and agents/ but not parent)
mkdir -p "$HOME/.openclaw/sessions" "$HOME/.openclaw/agents" "$HOME/.openclaw/workspace/skills"

# Apply baked config (not in volume-mounted path, so safe to overwrite)
if [ -f "/app/.openclaw-config/openclaw.json" ]; then
  cp /app/.openclaw-config/openclaw.json "$HOME/.openclaw/openclaw.json"
  echo "[openclaw-start] Config applied."
fi

# Copy baked skills into workspace (volume mounts agents/ and sessions/ only, not skills)
if [ -d "/app/skills" ]; then
  cp -r /app/skills/. "$HOME/.openclaw/workspace/skills/"
  echo "[openclaw-start] Skills applied: $(ls /app/skills)"
fi

echo "[openclaw-start] Starting OpenClaw gateway on 127.0.0.1:18788..."
node /app/openclaw.mjs gateway --port 18788 --allow-unconfigured &
OPENCLAW_PID=$!

echo "[openclaw-start] Waiting for gateway to become ready (up to 90s)..."
READY=0
for i in $(seq 1 45); do
  if node -e "fetch('http://127.0.0.1:18788/healthz').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "[openclaw-start] Gateway ready after $((i*2))s"
    READY=1
    break
  fi
  if ! kill -0 $OPENCLAW_PID 2>/dev/null; then
    echo "[openclaw-start] ERROR: OpenClaw process exited unexpectedly"
    exit 1
  fi
  sleep 2
done

if [ "$READY" = "0" ]; then
  echo "[openclaw-start] ERROR: Gateway did not become ready in 90s"
  exit 1
fi

echo "[openclaw-start] Starting socat: 0.0.0.0:18789 -> 127.0.0.1:18788"
socat TCP4-LISTEN:18789,bind=0.0.0.0,fork,reuseaddr TCP4:127.0.0.1:18788 &
SOCAT_PID=$!
echo "[openclaw-start] Socat forwarder running (PID=$SOCAT_PID)"
echo "[openclaw-start] OpenClaw gateway accessible at :18789"

# Wait for OpenClaw; if it exits, clean up
wait $OPENCLAW_PID
EXIT_CODE=$?
echo "[openclaw-start] OpenClaw exited with code $EXIT_CODE"
kill $SOCAT_PID 2>/dev/null
exit $EXIT_CODE
