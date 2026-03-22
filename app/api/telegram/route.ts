import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { nanoid } from "nanoid";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function telegramApi(method: string, body?: object) {
  if (!BOT_TOKEN) throw new Error("No TELEGRAM_BOT_TOKEN");
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const action = request.nextUrl.searchParams.get("action");

  try {
    // Get or create telegram connection record
    let conn = await prisma.telegramConnection.findUnique({ where: { userId } });

    if (action === "generate-code" || !conn?.linkCode) {
      const linkCode = nanoid(8).toUpperCase();
      conn = await prisma.telegramConnection.upsert({
        where: { userId },
        create: { userId, linkCode, status: "pending" },
        update: { linkCode, status: conn?.chatId ? conn.status : "pending" },
      });
    }

    // Get bot info
    let botUsername = null;
    if (BOT_TOKEN) {
      try {
        const botInfo = await telegramApi("getMe", {});
        botUsername = botInfo?.result?.username;
      } catch {
        // ignore bot info errors
      }
    }

    return NextResponse.json({
      status: conn?.status || "pending",
      linkCode: conn?.linkCode || null,
      chatId: conn?.chatId || null,
      username: conn?.username || null,
      botUsername,
    });
  } catch (err) {
    console.error("Telegram GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  if (action === "setup-webhook") {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const APP_URL = process.env.APP_URL || "https://zeniclaw.zenova.id";
    try {
      const result = await telegramApi("setWebhook", {
        url: `${APP_URL}/api/telegram/webhook`,
      });
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: "Failed to setup webhook" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
