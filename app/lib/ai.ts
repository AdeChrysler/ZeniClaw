import { prisma } from "./db";

const OPENCLAW_URL = process.env.OPENCLAW_URL || "http://openclaw:18789";
const OPENCLAW_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are ZeniClaw, an AI Executive Assistant (Chief of Staff) for busy CEOs and professionals.
You help with: daily briefings, task management, scheduling, email triage, meeting prep, research, and team coordination.
You are proactive, concise, and business-focused. Respond in the user's language (Indonesian or English).
When given a task, confirm it, set a reminder if needed, and follow up.
You remember everything across conversations.`;

type MessageHistory = Array<{ role: string; content: string }>;

async function callOpenClaw(
  userId: string,
  userMessage: string,
  history: MessageHistory
): Promise<string> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch(`${OPENCLAW_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENCLAW_TOKEN}`,
    },
    body: JSON.stringify({
      model: "openclaw",
      messages,
      user: userId, // stable session key per user
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`OpenClaw API error: ${response.status}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error("OpenClaw returned empty response");
  }
  return reply;
}

async function callGemini(
  apiKey: string,
  userMessage: string,
  history: MessageHistory
): Promise<string> {
  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Maaf, saya tidak dapat memproses pesan tersebut."
  );
}

export async function generateAIResponse(
  userId: string,
  userMessage: string,
  channel: "whatsapp" | "telegram" | "web"
): Promise<string> {
  try {
    // Fetch last 20 messages for context
    const history = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { role: true, content: true },
    });
    history.reverse();

    let reply: string;

    // Try OpenClaw first, fall back to Gemini if unavailable
    try {
      reply = await callOpenClaw(userId, userMessage, history);
    } catch (openclawError) {
      console.error("OpenClaw unavailable, falling back to Gemini:", openclawError);
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return "Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.";
      }
      reply = await callGemini(apiKey, userMessage, history);
    }

    // Save both messages to DB for dashboard display
    await prisma.message.createMany({
      data: [
        { userId, channel, role: "user", content: userMessage },
        { userId, channel, role: "assistant", content: reply },
      ],
    });

    return reply;
  } catch (error) {
    console.error("AI error:", error);
    return "Maaf, ada kendala teknis saat ini. Silakan coba lagi dalam beberapa saat.";
  }
}
