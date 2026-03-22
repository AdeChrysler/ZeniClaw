import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { nanoid } from "nanoid";

async function telegramApi(botToken: string, method: string, body?: object) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
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

    if (action === "generate-code" || (conn?.botToken && !conn?.linkCode)) {
      const linkCode = nanoid(8).toUpperCase();
      conn = await prisma.telegramConnection.upsert({
        where: { userId },
        create: { userId, linkCode, status: "pending" },
        update: { linkCode, status: conn?.chatId ? conn.status : "pending" },
      });
    }

    // Get bot info using user's bot token
    let botUsername = null;
    if (conn?.botToken) {
      try {
        const botInfo = await telegramApi(conn.botToken, "getMe");
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
      botToken: conn?.botToken ? "configured" : null,
      botUsername,
    });
  } catch (err) {
    console.error("Telegram GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  if (action === "save-token") {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const { botToken } = await request.json();

    if (!botToken || typeof botToken !== "string") {
      return NextResponse.json({ error: "botToken is required" }, { status: 400 });
    }

    // Validate the bot token by calling getMe
    try {
      const botInfo = await telegramApi(botToken, "getMe");
      if (!botInfo?.result?.username) {
        return NextResponse.json({ error: "Invalid bot token" }, { status: 400 });
      }

      // Generate link code
      const linkCode = nanoid(8).toUpperCase();
      const APP_URL = process.env.APP_URL || "https://zeniclaw.zenova.id";

      // Save token and reset connection
      await prisma.telegramConnection.upsert({
        where: { userId },
        create: { userId, botToken, linkCode, status: "pending" },
        update: { botToken, linkCode, status: "pending", chatId: null, username: null },
      });

      // Register webhook for this bot
      await telegramApi(botToken, "setWebhook", {
        url: `${APP_URL}/api/telegram/webhook`,
      });

      return NextResponse.json({ ok: true, botUsername: botInfo.result.username, linkCode });
    } catch {
      return NextResponse.json({ error: "Failed to validate bot token" }, { status: 400 });
    }
  }

  if (action === "setup-webhook") {
    const session = await requireAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const conn = await prisma.telegramConnection.findUnique({ where: { userId } });
    if (!conn?.botToken) {
      return NextResponse.json({ error: "No bot token configured" }, { status: 400 });
    }

    const APP_URL = process.env.APP_URL || "https://zeniclaw.zenova.id";
    try {
      const result = await telegramApi(conn.botToken, "setWebhook", {
        url: `${APP_URL}/api/telegram/webhook`,
      });
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({ error: "Failed to setup webhook" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
