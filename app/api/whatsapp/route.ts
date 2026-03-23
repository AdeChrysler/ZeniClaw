import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://openclaw:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

function openclawHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (OPENCLAW_TOKEN) headers["Authorization"] = `Bearer ${OPENCLAW_TOKEN}`;
  return headers;
}

async function openclawRequest(path: string, method = "GET", body?: object) {
  const url = `${OPENCLAW_URL}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: openclawHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    const json = () => {
      try { return JSON.parse(text); } catch { return null; }
    };
    return { ok: res.ok, status: res.status, text, json };
  } catch (err) {
    console.error(`[openclaw] ${method} ${url} error:`, err);
    return { ok: false, status: 0, text: String(err), json: () => null };
  }
}

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const action = request.nextUrl.searchParams.get("action");

  try {
    if (action === "qr") {
      // Request QR code from OpenClaw WhatsApp channel
      const res = await fetch(`${OPENCLAW_URL}/api/channels/whatsapp/qr`, {
        headers: openclawHeaders(),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error(`[openclaw] QR not available: ${res.status} ${errText}`);
        return NextResponse.json(
          { error: `QR belum siap: ${res.status}. Pastikan OpenClaw sudah terhubung.` },
          { status: 503 }
        );
      }
      // Return QR image as-is
      const buffer = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || "image/png";
      return new NextResponse(buffer, { headers: { "Content-Type": contentType } });
    }

    if (action === "status") {
      const res = await openclawRequest("/api/channels/whatsapp");
      const data = res.json();
      const channelStatus = data?.status || (res.ok ? "unknown" : "disconnected");

      // Sync to DB for dashboard display
      if (channelStatus === "connected" || channelStatus === "working") {
        await prisma.whatsAppConnection.upsert({
          where: { userId },
          create: {
            userId,
            sessionName: "openclaw",
            status: "connected",
            phoneNumber: data?.phone || null,
            pushName: data?.name || null,
            connectedAt: new Date(),
          },
          update: {
            status: "connected",
            phoneNumber: data?.phone || null,
            pushName: data?.name || null,
            connectedAt: new Date(),
          },
        });
      }

      const conn = await prisma.whatsAppConnection.findUnique({ where: { userId } });
      return NextResponse.json({
        status: conn?.status || "disconnected",
        sessionName: "openclaw",
        phoneNumber: conn?.phoneNumber || data?.phone || null,
        pushName: conn?.pushName || data?.name || null,
        openclawStatus: channelStatus,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("WhatsApp GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const action = request.nextUrl.searchParams.get("action");

  try {
    if (action === "start") {
      // Trigger OpenClaw WhatsApp pairing (generates QR)
      const res = await openclawRequest("/api/channels/whatsapp/pair", "POST", {
        dmPolicy: "pairing",
      });

      if (!res.ok) {
        const errMsg = res.json()?.message || res.text || `HTTP ${res.status}`;
        console.error(`[openclaw] Pairing failed: ${errMsg}`);
        return NextResponse.json(
          { error: `Gagal memulai pairing WhatsApp: ${errMsg}` },
          { status: 502 }
        );
      }

      await prisma.whatsAppConnection.upsert({
        where: { userId },
        create: { userId, sessionName: "openclaw", status: "connecting" },
        update: { status: "connecting" },
      });

      return NextResponse.json({ ok: true, sessionName: "openclaw" });
    }

    if (action === "disconnect") {
      await openclawRequest("/api/channels/whatsapp/disconnect", "POST");
      await prisma.whatsAppConnection.updateMany({
        where: { userId },
        data: {
          status: "disconnected",
          phoneNumber: null,
          pushName: null,
          connectedAt: null,
        },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("WhatsApp POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
