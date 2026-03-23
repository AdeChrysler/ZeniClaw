#!/usr/bin/env node
/**
 * OpenClaw Gateway — OpenAI-compatible AI gateway backed by Google Gemini
 * Listens on port 18789, implements /healthz and /v1/chat/completions
 */

const http = require("http");

const PORT = parseInt(process.env.OPENCLAW_PORT || "18789", 10);
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "zeniclaw-gateway-secret";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.OPENCLAW_MODEL || "gemini-2.5-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(json),
  });
  res.end(json);
}

function authenticate(req) {
  const auth = req.headers["authorization"] || "";
  if (!auth.startsWith("Bearer ")) return false;
  return auth.slice(7) === GATEWAY_TOKEN;
}

async function callGemini(messages) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  // Extract system message if present
  const systemMsg = messages.find((m) => m.role === "system");
  const conversationMsgs = messages.filter((m) => m.role !== "system");

  const contents = conversationMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.7,
    },
  };

  if (systemMsg) {
    body.system_instruction = { parts: [{ text: systemMsg.content }] };
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.status);
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "I could not generate a response.";
  return text;
}

async function handleChatCompletions(req, res) {
  if (!authenticate(req)) {
    return sendJson(res, 401, { error: { message: "Unauthorized", type: "auth_error" } });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (e) {
    return sendJson(res, 400, { error: { message: e.message, type: "invalid_request_error" } });
  }

  const messages = body.messages || [];
  if (!messages.length) {
    return sendJson(res, 400, { error: { message: "messages is required", type: "invalid_request_error" } });
  }

  try {
    const text = await callGemini(messages);
    const response = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model || "openclaw",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: text },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
    sendJson(res, 200, response);
  } catch (e) {
    console.error("OpenClaw error:", e.message);
    sendJson(res, 500, { error: { message: e.message, type: "server_error" } });
  }
}

const server = http.createServer(async (req, res) => {
  const url = req.url?.split("?")[0];

  if (req.method === "GET" && url === "/healthz") {
    return sendJson(res, 200, {
      status: "ok",
      model: GEMINI_MODEL,
      gemini_configured: !!GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === "POST" && url === "/v1/chat/completions") {
    return handleChatCompletions(req, res);
  }

  sendJson(res, 404, { error: { message: "Not found", type: "not_found" } });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`OpenClaw Gateway running on port ${PORT}`);
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log(`Gemini configured: ${!!GEMINI_API_KEY}`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
