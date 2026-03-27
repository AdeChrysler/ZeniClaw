import { NextResponse } from "next/server";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://openclaw:18789";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // Run openclaw and DB checks in parallel with short timeouts so this
  // endpoint always responds in <3s (well within Traefik's 10s health check timeout).
  const [openclawResult, dbResult] = await Promise.allSettled([
    // OpenClaw check — 2s timeout to leave margin for DB + response overhead
    (async () => {
      const res = await fetch(`${OPENCLAW_URL}/healthz`, {
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) return { status: "error", code: res.status, url: OPENCLAW_URL };
      const text = await res.text().catch(() => "");
      return { status: "ok", url: OPENCLAW_URL, response: text.slice(0, 100) };
    })(),
    // DB check — 5s hard timeout so a stalled Prisma pool never blocks this endpoint
    Promise.race([
      (async () => {
        const { prisma } = await import("@/app/lib/db");
        await prisma.$queryRaw`SELECT 1`;
        return { status: "ok" };
      })(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB health check timed out after 5s")), 5000)
      ),
    ]),
  ]);

  checks.openclaw =
    openclawResult.status === "fulfilled"
      ? openclawResult.value
      : { status: "unreachable", error: String((openclawResult as PromiseRejectedResult).reason), url: OPENCLAW_URL };

  checks.db =
    dbResult.status === "fulfilled"
      ? dbResult.value
      : { status: "error", error: String((dbResult as PromiseRejectedResult).reason) };

  // Telegram — per-user bot tokens
  checks.telegram = {
    status: "per_user",
    note: "Users provide their own bot token via dashboard",
  };

  // WhatsApp — managed by OpenClaw (status tracked via DB)
  checks.whatsapp = { status: "managed_by_openclaw", source: "openclaw" };

  // App health is based on DB + process, not openclaw.
  // Openclaw down = degraded (WhatsApp features unavailable), not a full outage.
  // Returning 503 when openclaw is down causes Traefik to drop ALL traffic.
  const dbOk = checks.db && (checks.db as Record<string, unknown>).status === "ok";
  const openclawOk = checks.openclaw && (checks.openclaw as Record<string, unknown>).status === "ok";
  const overallOk = dbOk;

  return NextResponse.json(
    {
      app: "zeniclaw",
      timestamp: new Date().toISOString(),
      healthy: overallOk,
      degraded: !openclawOk,
      checks,
    },
    { status: overallOk ? 200 : 503 }
  );
}
