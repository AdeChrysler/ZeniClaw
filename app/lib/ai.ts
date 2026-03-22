const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `You are ZeniClaw, an AI Chief of Staff for busy CEOs and professionals in Southeast Asia.
You are helpful, proactive, and concise. You operate via WhatsApp and Telegram.

Your core capabilities:
- Daily briefings and calendar summaries
- Task creation, tracking, and reminders
- Email triage and draft responses
- Meeting prep and follow-ups
- Research and business intel
- Team coordination and delegation

Respond in the same language as the user (Bahasa Indonesia or English).
Keep responses concise and actionable — this is a chat interface.
If asked to do something outside your capabilities, politely explain and suggest what you CAN help with.`;

export async function generateAIResponse(userMessage: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "ZeniClaw AI is not configured yet. Please add GEMINI_API_KEY to activate intelligent responses.";
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini error:", err);
      return "Maaf, ZeniClaw sedang mengalami gangguan. Coba lagi sebentar. (AI service error)";
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || "Maaf, tidak ada respons dari AI. Coba lagi.";
  } catch (err) {
    console.error("AI generation failed:", err);
    return "Maaf, ZeniClaw sedang tidak tersedia. Coba lagi nanti.";
  }
}
