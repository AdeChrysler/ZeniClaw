import { NextRequest } from "next/server";
import { generateAIResponse } from "@/app/lib/ai";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

async function sendTelegramMessage(chatId: number, text: string) {
  if (!TELEGRAM_BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request: NextRequest) {
  let update: Record<string, unknown>;
  try {
    update = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const message = update.message as Record<string, unknown> | undefined;
  if (!message) return Response.json({ ok: true });

  const chatId = (message.chat as Record<string, unknown>)?.id as number;
  const text = message.text as string | undefined;

  if (!chatId || !text) return Response.json({ ok: true });

  // Generate AI response and send reply
  const reply = await generateAIResponse(text);
  await sendTelegramMessage(chatId, reply);

  return Response.json({ ok: true });
}

// Telegram requires 200 OK for all valid webhook calls
export async function GET() {
  return Response.json({ ok: true, service: "zeniclaw-telegram-webhook" });
}
