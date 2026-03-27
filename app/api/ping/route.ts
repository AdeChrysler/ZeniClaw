import { NextResponse } from "next/server";

// Lightweight liveness probe — always returns 200 if the process is running.
// Used by Traefik as the backend health check so transient DB/openclaw issues
// don't cause Traefik to drop traffic and show "no available server".
// Use /api/health for detailed dependency status.
export async function GET() {
  return NextResponse.json({ ok: true });
}
