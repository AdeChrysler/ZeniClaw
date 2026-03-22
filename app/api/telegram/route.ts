import { NextRequest } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const APP_URL = process.env.APP_URL || "https://zeniclaw.zenova.id";

function telegramApi(method: string) {
  return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
}

export async function GET() {
  if (!TELEGRAM_BOT_TOKEN) {
    return Response.json({ status: "NOT_CONFIGURED", message: "TELEGRAM_BOT_TOKEN not set" });
  }

  try {
    const [meRes, webhookRes] = await Promise.all([
      fetch(telegramApi("getMe")),
      fetch(telegramApi("getWebhookInfo")),
    ]);

    const me = await meRes.json();
    const webhookInfo = await webhookRes.json();

    return Response.json({
      status: me.ok ? "CONNECTED" : "ERROR",
      bot: me.ok ? { username: me.result.username, name: me.result.first_name } : null,
      webhook: webhookInfo.ok ? webhookInfo.result : null,
    });
  } catch {
    return Response.json({ status: "ERROR", message: "Failed to reach Telegram API" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action");

  if (!TELEGRAM_BOT_TOKEN) {
    return Response.json({ error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 503 });
  }

  if (action === "setup-webhook") {
    try {
      const webhookUrl = `${APP_URL}/api/telegram/webhook`;
      const res = await fetch(telegramApi("setWebhook"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const data = await res.json();
      return Response.json(data, { status: res.status });
    } catch {
      return Response.json({ error: "Failed to set webhook" }, { status: 503 });
    }
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
