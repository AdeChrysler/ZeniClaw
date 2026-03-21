import { NextRequest } from "next/server";

const WAHA_URL = process.env.WAHA_URL || "http://waha:3000";
const SESSION = "zeniclaw";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action") || "status";

  try {
    if (action === "qr") {
      // Return QR code as image from WAHA
      const res = await fetch(
        `${WAHA_URL}/api/${SESSION}/auth/qr?format=image`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        return Response.json(
          { error: "WhatsApp agent not ready", code: "NOT_READY" },
          { status: 503 }
        );
      }
      const buf = await res.arrayBuffer();
      return new Response(buf, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache, no-store",
        },
      });
    }

    if (action === "status") {
      const res = await fetch(`${WAHA_URL}/api/sessions/${SESSION}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        return Response.json({ status: "STOPPED", session: SESSION });
      }
      const data = await res.json();
      return Response.json({
        status: data.status || "UNKNOWN",
        session: SESSION,
        me: data.me || null,
      });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return Response.json(
      { error: "WhatsApp service unavailable", status: "STOPPED" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  if (action === "start") {
    try {
      const res = await fetch(`${WAHA_URL}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: SESSION, config: {} }),
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch {
      return Response.json({ error: "Failed to start session" }, { status: 503 });
    }
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
