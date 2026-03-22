import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/app/lib/ai";
import { prisma } from "@/app/lib/db";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function sendTelegramMessage(chatId: string | number, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    const message = update?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = String(message.chat?.id);
    const text = message.text;
    const username = message.from?.username;

    if (!text || !chatId) return NextResponse.json({ ok: true });

    // Handle /start {linkCode} command
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const linkCode = parts[1]?.trim().toUpperCase();

      if (linkCode) {
        const conn = await prisma.telegramConnection.findUnique({
          where: { linkCode },
        });

        if (conn && conn.status !== "connected") {
          await prisma.telegramConnection.update({
            where: { linkCode },
            data: {
              chatId,
              status: "connected",
              username: username || null,
            },
          });
          await sendTelegramMessage(chatId, "Telegram kamu berhasil terhubung ke ZeniClaw! Selamat datang. Kamu bisa mulai chat dengan AI Assistant kamu sekarang.");
          return NextResponse.json({ ok: true });
        } else if (conn?.status === "connected") {
          await sendTelegramMessage(chatId, "Akun ini sudah terhubung. Kamu bisa langsung chat!");
          return NextResponse.json({ ok: true });
        }
      }

      await sendTelegramMessage(chatId, "Halo! Untuk menghubungkan Telegram kamu ke ZeniClaw, buka dashboard dan gunakan kode link yang tersedia.");
      return NextResponse.json({ ok: true });
    }

    // Find user by chatId
    const conn = await prisma.telegramConnection.findFirst({
      where: { chatId, status: "connected" },
    });

    if (!conn) {
      await sendTelegramMessage(chatId, "Akun kamu belum terhubung. Kunjungi zeniclaw.zenova.id untuk mendaftar dan hubungkan Telegram kamu.");
      return NextResponse.json({ ok: true });
    }

    const reply = await generateAIResponse(conn.userId, text, "telegram");
    await sendTelegramMessage(chatId, reply);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "zeniclaw-telegram-webhook" });
}
