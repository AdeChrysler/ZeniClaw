import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

// OpenClaw webhook — receives message events from OpenClaw's WhatsApp channel
// OpenClaw handles the full AI loop (receive → process → reply via Baileys)
// This webhook is used for logging messages to our DB for dashboard display.
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // OpenClaw webhook format: { event, channel, session, from, message, reply }
    const event = payload?.event;
    if (!event) return NextResponse.json({ ok: true });

    const channel = payload?.channel || "whatsapp";
    const from = payload?.from || payload?.userId;
    const userMessage = payload?.message || payload?.text;
    const aiReply = payload?.reply || payload?.response;

    if (!from || !userMessage) return NextResponse.json({ ok: true });

    // Resolve userId from the 'from' identifier (phone number or session ref)
    // Try to find a WhatsApp connection by phone number
    const conn = await prisma.whatsAppConnection.findFirst({
      where: { phoneNumber: from.replace(/\D/g, "") },
    });
    const userId = conn?.userId || from;

    // Log messages to DB for dashboard display
    const records: { userId: string; channel: string; role: string; content: string }[] = [
      { userId, channel, role: "user", content: userMessage },
    ];
    if (aiReply) {
      records.push({ userId, channel, role: "assistant", content: aiReply });
    }

    await prisma.message.createMany({ data: records });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ ok: true }); // always 200 to avoid OpenClaw retry storms
  }
}
