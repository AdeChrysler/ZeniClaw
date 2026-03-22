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

  // Telegram
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  checks.telegram = { 
    status: telegramToken ? "configured" : "missing_token",
    tokenSet: !!telegramToken
  };

  return NextResponse.json({ 
    app: "zeniclaw", 
    timestamp: new Date().toISOString(),
    checks 
  });
}
