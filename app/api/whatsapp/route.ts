import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

const WAHA_URL = process.env.WAHA_URL || "http://waha.sixzenith.space:3003";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "666";
const APP_URL = process.env.APP_URL || "https://zeniclaw.zenova.id";

async function wahaRequest(path: string, method = "GET", body?: object) {
  const res = await fetch(`${WAHA_URL}${path}`, {
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
      const res = await wahaRequest(`/api/screenshot?session=${sessionName}`);
      if (!res.ok) return NextResponse.json({ error: "QR not available" }, { status: 404 });
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
      const data = await res.json();
      const status = data.status || "disconnected";

      // Update DB if connected
      if (status === "WORKING") {
        const me = await wahaRequest(`/api/sessions/${sessionName}/me`);
        if (me.ok) {
          const meData = await me.json();
          await prisma.whatsAppConnection.upsert({
            where: { userId },
            create: {
              userId,
              sessionName,
              status: "connected",
              phoneNumber: meData.id?.replace("@c.us", "") || null,
              pushName: meData.pushName || null,
              connectedAt: new Date(),
            },
            update: {
              status: "connected",
              phoneNumber: meData.id?.replace("@c.us", "") || null,
              pushName: meData.pushName || null,
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
      // Create WAHA session for this user
      const webhookUrl = `${APP_URL}/api/whatsapp/webhook?userId=${userId}`;
      await wahaRequest(`/api/sessions`, "POST", {
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
