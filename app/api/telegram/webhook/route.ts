import { NextRequest, NextResponse } from "next/server";
import { generateAIResponse } from "@/app/lib/ai";
import { prisma } from "@/app/lib/db";

async function sendTelegramMessage(botToken: string, chatId: string | number, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
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

        if (conn && conn.botToken && conn.status !== "connected") {
          await prisma.telegramConnection.update({
            where: { linkCode },
            data: {
              chatId,
              status: "connected",
              username: username || null,
            },
          });
          await sendTelegramMessage(conn.botToken, chatId, "Telegram kamu berhasil terhubung ke ZeniClaw! Selamat datang. Kamu bisa mulai chat dengan AI Assistant kamu sekarang.");
          return NextResponse.json({ ok: true });
        } else if (conn?.status === "connected" && conn.botToken) {
          await sendTelegramMessage(conn.botToken, chatId, "Akun ini sudah terhubung. Kamu bisa langsung chat!");
          return NextResponse.json({ ok: true });
        }
      }

      // No matching linkCode — find by chatId if already connected
      const existingConn = await prisma.telegramConnection.findFirst({
        where: { chatId, status: "connected" },
      });
      if (existingConn?.botToken) {
        await sendTelegramMessage(existingConn.botToken, chatId, "Akun ini sudah terhubung. Kamu bisa langsung chat!");
      }
      return NextResponse.json({ ok: true });
    }

    // Find user by chatId
    const conn = await prisma.telegramConnection.findFirst({
      where: { chatId, status: "connected" },
    });

    if (!conn || !conn.botToken) {
      // Try to find any conn with this chatId to get the bot token for reply
      const anyConn = await prisma.telegramConnection.findFirst({ where: { chatId } });
      if (anyConn?.botToken) {
        await sendTelegramMessage(anyConn.botToken, chatId, "Akun kamu belum terhubung. Kunjungi zeniclaw.zenova.id untuk mendaftar dan hubungkan Telegram kamu.");
      }
      return NextResponse.json({ ok: true });
    }

    const reply = await generateAIResponse(conn.userId, text, "telegram");
    await sendTelegramMessage(conn.botToken, chatId, reply);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "zeniclaw-telegram-webhook" });
}
