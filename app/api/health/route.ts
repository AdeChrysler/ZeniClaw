import { NextResponse } from "next/server";

const WAHA_URL = process.env.WAHA_URL || "http://waha.sixzenith.com:3003";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "666";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // Check WAHA
  try {
    const wahaRes = await fetch(`${WAHA_URL}/api/version`, {
      headers: { "X-Api-Key": WAHA_API_KEY },
      signal: AbortSignal.timeout(5000)
    });
    if (wahaRes.ok) {
      const data = await wahaRes.json();
      checks.waha = { status: "ok", version: data.version, url: WAHA_URL };
    } else {
      checks.waha = { status: "error", code: wahaRes.status, url: WAHA_URL };
    }
  } catch (e) {
    checks.waha = { status: "unreachable", error: String(e), url: WAHA_URL };
  }

  // Check DB
  try {
    const { prisma } = await import("@/app/lib/db");
    await prisma.$queryRaw`SELECT 1`;
    checks.db = { status: "ok" };
  } catch (e) {
    checks.db = { status: "error", error: String(e) };
  }

  // Telegram - per-user bot tokens (no global token needed)
  checks.telegram = {
    status: "per_user",
    note: "Users provide their own bot token via dashboard"
  };

  return NextResponse.json({ 
    app: "zeniclaw", 
    timestamp: new Date().toISOString(),
    checks 
  });
}
