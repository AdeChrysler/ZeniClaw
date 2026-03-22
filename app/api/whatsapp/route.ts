import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

const WAHA_URL = process.env.WAHA_URL || "http://waha.sixzenith.com:3003";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "666";
const APP_URL = process.env.APP_URL || "https://zeniclaw.zenova.id";

async function wahaRequest(path: string, method = "GET", body?: object) {
  const url = `${WAHA_URL}${path}`;
  console.log(`[WAHA] ${method} ${url}`, body ? JSON.stringify(body) : "");
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": WAHA_API_KEY,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    console.log(`[WAHA] ${method} ${url} → ${res.status}: ${text.substring(0, 500)}`);
    return { ok: res.ok, status: res.status, text, json: () => { try { return JSON.parse(text); } catch { return null; } } };
  } catch (err) {
    console.error(`[WAHA] ${method} ${url} FETCH ERROR:`, err);
    return { ok: false, status: 0, text: String(err), json: () => null };
  }
}

async function wahaRequestRaw(path: string, method = "GET", body?: object) {
  const url = `${WAHA_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": WAHA_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const sessionName = `zeniclaw-${userId}`;
  const action = request.nextUrl.searchParams.get("action");

  try {
    if (action === "qr") {
      // Return QR image as raw bytes — use raw fetch to preserve binary
      // WAHA QR endpoint is /auth/qr (no .png extension — qr.png returns 404)
      const res = await wahaRequestRaw(`/api/${sessionName}/auth/qr`);
      if (!res.ok) {
        const errText = await res.text().catch(() => "unknown");
        console.error(`[WAHA] QR not available for ${sessionName}: ${res.status} ${errText}`);
        return NextResponse.json({ error: `QR tidak tersedia: ${res.status} - ${errText}` }, { status: 404 });
      }
      const buffer = await res.arrayBuffer();
      return new NextResponse(buffer, {
        headers: { "Content-Type": "image/png" },
      });
    }

    if (action === "status") {
      const res = await wahaRequest(`/api/sessions/${sessionName}`);
      if (!res.ok) {
        return NextResponse.json({ status: "disconnected", sessionName });
      }
      const data = res.json();
      const status = data?.status || "disconnected";

      // Update DB if connected
      if (status === "WORKING") {
        const me = await wahaRequest(`/api/sessions/${sessionName}/me`);
        if (me.ok) {
          const meData = me.json();
          await prisma.whatsAppConnection.upsert({
            where: { userId },
            create: {
              userId,
              sessionName,
              status: "connected",
              phoneNumber: meData?.id?.replace("@c.us", "") || null,
              pushName: meData?.pushName || null,
              connectedAt: new Date(),
            },
            update: {
              status: "connected",
              phoneNumber: meData?.id?.replace("@c.us", "") || null,
              pushName: meData?.pushName || null,
              connectedAt: new Date(),
            },
          });
        }
      }

      // Return DB connection info
      const conn = await prisma.whatsAppConnection.findUnique({ where: { userId } });
      return NextResponse.json({
        status: conn?.status || "disconnected",
        sessionName,
        phoneNumber: conn?.phoneNumber || null,
        pushName: conn?.pushName || null,
        wahaStatus: status,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("WhatsApp API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const sessionName = `zeniclaw-${userId}`;
  const action = request.nextUrl.searchParams.get("action");

  try {
    if (action === "start") {
      // Check if session already exists first
      const existingSession = await wahaRequest(`/api/sessions/${sessionName}`);
      if (existingSession.ok) {
        const existingData = existingSession.json();
        const existingStatus = existingData?.status;
        console.log(`[WAHA] Session ${sessionName} already exists with status: ${existingStatus}`);
        // If session exists and is working, just update DB
        if (existingStatus === "WORKING") {
          await prisma.whatsAppConnection.upsert({
            where: { userId },
            create: { userId, sessionName, status: "connected" },
            update: { status: "connected" },
          });
          return NextResponse.json({ ok: true, sessionName, status: "connected" });
        }
        // If session is STARTING or SCAN_QR_CODE, just update DB to connecting
        if (existingStatus === "STARTING" || existingStatus === "SCAN_QR_CODE") {
          await prisma.whatsAppConnection.upsert({
            where: { userId },
            create: { userId, sessionName, status: "connecting" },
            update: { status: "connecting" },
          });
          return NextResponse.json({ ok: true, sessionName, status: "connecting" });
        }
        // If session is STOPPED or FAILED, delete and recreate
        if (existingStatus === "STOPPED" || existingStatus === "FAILED") {
          console.log(`[WAHA] Deleting stale session ${sessionName}`);
          await wahaRequest(`/api/sessions/${sessionName}`, "DELETE");
        }
      }

      // Create WAHA session for this user
      const webhookUrl = `${APP_URL}/api/whatsapp/webhook?userId=${userId}`;
      const createRes = await wahaRequest(`/api/sessions`, "POST", {
        name: sessionName,
        start: true,
        config: {
          webhooks: [
            {
              url: webhookUrl,
              events: ["message"],
            },
          ],
        },
      });

      if (!createRes.ok) {
        const errMsg = createRes.json()?.message || createRes.text || `HTTP ${createRes.status}`;
        console.error(`[WAHA] Failed to create session ${sessionName}: ${errMsg}`);
        return NextResponse.json(
          { error: `Gagal membuat sesi WAHA: ${errMsg}` },
          { status: 502 }
        );
      }

      await prisma.whatsAppConnection.upsert({
        where: { userId },
        create: { userId, sessionName, status: "connecting" },
        update: { status: "connecting" },
      });

      return NextResponse.json({ ok: true, sessionName });
    }

    if (action === "disconnect") {
      await wahaRequest(`/api/sessions/${sessionName}/stop`, "POST");
      await wahaRequest(`/api/sessions/${sessionName}`, "DELETE");
      await prisma.whatsAppConnection.updateMany({
        where: { userId },
        data: { status: "disconnected", phoneNumber: null, pushName: null, connectedAt: null },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("WhatsApp POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
