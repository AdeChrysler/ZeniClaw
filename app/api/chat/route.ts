import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { generateAIResponse } from "@/app/lib/ai";
import { prisma } from "@/app/lib/db";

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await request.json();
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const reply = await generateAIResponse(session.user.id, message.trim(), "web");
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = request.nextUrl.searchParams.get("since");
  const where = since
    ? { userId: session.user.id, createdAt: { gt: new Date(since) } }
    : { userId: session.user.id };

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json({ messages });
}
