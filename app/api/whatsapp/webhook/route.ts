import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/app/lib/ai";

const WAHA_URL = process.env.WAHA_URL;
const WAHA_API_KEY = process.env.WAHA_API_KEY || "666";

export async function POST(request: NextRequest) {
  try {
    // userId passed as query param when session was created
    const userId = request.nextUrl.searchParams.get("userId");

    const payload = await request.json();
    const event = payload?.event;

    if (event !== "message") return NextResponse.json({ ok: true });

    const message = payload?.payload;
    if (!message) return NextResponse.json({ ok: true });

    const fromMe = message?.fromMe;
    if (fromMe) return NextResponse.json({ ok: true });

    const text = message?.body;
    const chatId = message?.from;
    const sessionName = payload?.session;

    if (!text || !chatId) return NextResponse.json({ ok: true });

    // Resolve userId from sessionName if not in query param
    let resolvedUserId = userId;
    if (!resolvedUserId && sessionName) {
      // session name format: zeniclaw-{userId}
      resolvedUserId = sessionName.replace("zeniclaw-", "");
    }

    if (!resolvedUserId) {
      console.error("No userId found for webhook");
      return NextResponse.json({ ok: true });
    }

    const reply = await generateAIResponse(resolvedUserId, text, "whatsapp");

    // Send reply via WAHA
    await fetch(`${WAHA_URL}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": WAHA_API_KEY,
      },
      body: JSON.stringify({
        session: sessionName,
        chatId,
        text: reply,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "zeniclaw-whatsapp-webhook" });
}
