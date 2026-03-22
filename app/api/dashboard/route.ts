import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export async function GET() {
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [user, whatsapp, telegram, messages, todayMessages] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.whatsAppConnection.findUnique({ where: { userId } }),
    prisma.telegramConnection.findUnique({ where: { userId } }),
    prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.message.count({
      where: { userId, createdAt: { gte: today } },
    }),
  ]);

  const activeConnections = [
    whatsapp?.status === "connected",
    telegram?.status === "connected",
  ].filter(Boolean).length;

  return NextResponse.json({
    user: {
      name: user?.name,
      email: user?.email,
      plan: user?.plan,
      trialEndsAt: user?.trialEndsAt,
    },
    whatsapp: {
      status: whatsapp?.status || "disconnected",
      phoneNumber: whatsapp?.phoneNumber || null,
      pushName: whatsapp?.pushName || null,
    },
    telegram: {
      status: telegram?.status || "pending",
      username: telegram?.username || null,
      linkCode: telegram?.linkCode || null,
    },
    stats: {
      messagesToday: todayMessages,
      activeConnections,
    },
    recentMessages: messages.map((m) => ({
      id: m.id,
      channel: m.channel,
      role: m.role,
      content: m.content.substring(0, 100),
      createdAt: m.createdAt,
    })),
  });
}
