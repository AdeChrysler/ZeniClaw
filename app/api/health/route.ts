import { NextResponse } from "next/server";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://openclaw:18789";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // Check real OpenClaw gateway via /healthz
  try {
    const openclawRes = await fetch(`${OPENCLAW_URL}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });
    if (openclawRes.ok) {
      const text = await openclawRes.text().catch(() => "");
      checks.openclaw = {
        status: "ok",
        url: OPENCLAW_URL,
        response: text.slice(0, 100),
      };
    } else {
      checks.openclaw = { status: "error", code: openclawRes.status, url: OPENCLAW_URL };
    }
  } catch (e) {
    checks.openclaw = { status: "unreachable", error: String(e), url: OPENCLAW_URL };
  }

  // Check DB
  try {
    const { prisma } = await import("@/app/lib/db");
    await prisma.$queryRaw`SELECT 1`;
    checks.db = { status: "ok" };
  } catch (e) {
    checks.db = { status: "error", error: String(e) };
  }

  // Telegram — per-user bot tokens
  checks.telegram = {
    status: "per_user",
    note: "Users provide their own bot token via dashboard",
  };

  // WhatsApp — managed by OpenClaw (status tracked via DB)
  checks.whatsapp = { status: "managed_by_openclaw", source: "openclaw" };

  const overallOk = checks.openclaw && (checks.openclaw as Record<string, unknown>).status === "ok";

  return NextResponse.json(
    {
      app: "zeniclaw",
      timestamp: new Date().toISOString(),
      healthy: overallOk,
      checks,
    },
    { status: overallOk ? 200 : 503 }
  );
}
