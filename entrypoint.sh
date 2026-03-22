#!/bin/sh
set -e

echo "[entrypoint] Running prisma db push..."
node node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate 2>&1 || echo "[entrypoint] Warning: prisma db push failed — tables may already exist or DB not ready"

echo "[entrypoint] Starting Next.js server..."
exec node server.js
