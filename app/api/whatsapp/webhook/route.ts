import { NextRequest } from "next/server";
import { generateAIResponse } from "@/app/lib/ai";

const WAHA_URL = process.env.WAHA_URL || "http://waha:3000";
const WAHA_API_KEY = process.env.WAHA_API_KEY || "";
const SESSION = "zeniclaw";

function wahaHeaders() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (WAHA_API_KEY) h["X-Api-Key"] = WAHA_API_KEY;
  return h;
}

async function sendWhatsAppMessage(chatId: string, text: string) {
  await fetch(`${WAHA_URL}/api/sendText`, {
    method: "POST",
    headers: wahaHeaders(),
    body: JSON.stringify({ chatId, text, session: SESSION }),
  });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const event = body.event as string;
  if (event !== "message") {
    return Response.json({ ok: true, skipped: true });
  }

  const payload = body.payload as Record<string, unknown> | undefined;
  if (!payload) return Response.json({ ok: true });

  // Skip messages sent by us
  if (payload.fromMe === true) return Response.json({ ok: true, skipped: "fromMe" });

  // Only handle text messages
  const messageType = payload.type as string;
  if (messageType !== "chat") return Response.json({ ok: true, skipped: "non-text" });

  const chatId = payload.from as string;
  const text = payload.body as string;

  if (!chatId || !text) return Response.json({ ok: true });

  // Generate AI response and reply
  const reply = await generateAIResponse(text);
  await sendWhatsAppMessage(chatId, reply);

  return Response.json({ ok: true });
}

// WAHA may send GET for webhook verification
export async function GET() {
  return Response.json({ ok: true, service: "zeniclaw-whatsapp-webhook" });
}
