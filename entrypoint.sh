#!/bin/sh
set -e

echo "[entrypoint] Running prisma db push..."
node node_modules/prisma/build/index.js db push --skip-generate 2>&1 || echo "[entrypoint] Warning: prisma db push failed — tables may already exist or DB not ready"

echo "[entrypoint] Starting OpenClaw gateway on port 18789..."
node openclaw-server.js &
OPENCLAW_PID=$!
echo "[entrypoint] OpenClaw started (PID: $OPENCLAW_PID)"

echo "[entrypoint] Starting Next.js server..."
exec node server.js
