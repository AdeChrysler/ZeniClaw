import { NextResponse } from "next/server";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://openclaw:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // Check real OpenClaw gateway status
  try {
    const openclawRes = await fetch(`${OPENCLAW_URL}/api/status`, {
      headers: OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {},
      signal: AbortSignal.timeout(5000),
    });
    if (openclawRes.ok) {
      const data = await openclawRes.json().catch(() => ({}));
      checks.openclaw = {
        status: "ok",
        url: OPENCLAW_URL,
        version: data.version || null,
        model: data.model || null,
        channels: data.channels || null,
        uptime: data.uptime || null,
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

  // WhatsApp — managed by OpenClaw Baileys plugin
  try {
    const waRes = await fetch(`${OPENCLAW_URL}/api/channels/whatsapp`, {
      headers: OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {},
      signal: AbortSignal.timeout(5000),
    });
    if (waRes.ok) {
      const data = await waRes.json().catch(() => ({}));
      checks.whatsapp = { status: data.status || "ok", source: "openclaw", data };
    } else {
      checks.whatsapp = { status: "unknown", source: "openclaw" };
    }
  } catch {
    checks.whatsapp = { status: "unknown", source: "openclaw" };
  }

  const overallOk = checks.openclaw && (checks.openclaw as Record<string, unknown>).status === "ok";

  return NextResponse.json({
    app: "zeniclaw",
    timestamp: new Date().toISOString(),
    healthy: overallOk,
    checks,
  });
}
