import { prisma } from "./db";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const SYSTEM_PROMPT = `Kamu adalah ZeniClaw — AI Chief of Staff personal untuk eksekutif dan profesional sibuk.

Kemampuan utamamu:
1. Daily Briefing — ringkasan harian (kalender, tugas, prioritas, metrik)
2. Task Management — buat, assign, tracking via bahasa natural
3. Email Triage — ringkasan inbox, draft balasan, flag urgent
4. Meeting Prep — brief otomatis dengan konteks peserta
5. Research & Intel — analisis kompetitor, riset pasar, info perusahaan
6. Team Relay — delegasi tugas ke tim via chat

Jawab dalam bahasa yang digunakan user (Indonesia atau Inggris).
Bersikap profesional, efisien, dan proaktif.
Jangan panjang lebar — eksekutif butuh jawaban singkat dan actionable.`;

export async function generateAIResponse(
  userId: string,
  userMessage: string,
  channel: "whatsapp" | "telegram"
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return "Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.";
  }

  try {
    // Fetch last 20 messages for context
    const history = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    history.reverse();

    // Build conversation context
    const contents = history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: userMessage }],
    });

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Maaf, saya tidak dapat memproses pesan tersebut.";

    // Save both messages to DB
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
