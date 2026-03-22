"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  channel: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageAt = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadHistory();
    const interval = setInterval(pollNew, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory() {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const { messages: msgs } = await res.json();
      setMessages(msgs);
      if (msgs.length > 0) lastMessageAt.current = msgs[msgs.length - 1].createdAt;
    } finally {
      setLoading(false);
    }
  }

  async function pollNew() {
    if (!lastMessageAt.current) return;
    const res = await fetch(`/api/chat?since=${encodeURIComponent(lastMessageAt.current)}`);
    if (!res.ok) return;
    const { messages: newMsgs } = await res.json();
    if (newMsgs.length > 0) {
      setMessages(prev => [...prev, ...newMsgs]);
      lastMessageAt.current = newMsgs[newMsgs.length - 1].createdAt;
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = { id: tempId, channel: "web", role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        // Remove stuck temp message and show error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setChatError("Gagal mengirim pesan. Silakan coba lagi.");
        return;
      }

      const data = await res.json();
      setChatError(null);

      // Replace temp message and add AI reply
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempId);
        const userMsg: Message = { id: `u-${Date.now()}`, channel: "web", role: "user", content: text, createdAt: new Date().toISOString() };
        const aiMsg: Message = { id: `a-${Date.now()}`, channel: "web", role: "assistant", content: data.reply || "...", createdAt: new Date().toISOString() };
        return [...withoutTemp, userMsg, aiMsg];
      });

      // Update lastMessageAt so poll doesn't re-fetch these
      lastMessageAt.current = new Date().toISOString();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setChatError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setSending(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Memuat...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold text-emerald-400">ZeniClaw</div>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">Dashboard</Link>
        </div>
        <span className="text-zinc-500 text-sm">{session.user?.name || session.user?.email}</span>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-3xl w-full mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 mt-20">
            <p className="text-lg mb-2">Selamat datang di ZeniClaw Web Chat</p>
            <p className="text-sm">Tanya apa saja — ZeniClaw siap membantu.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm"
                  : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.channel !== "web" && (
                  <p className="text-xs opacity-50 mt-1 capitalize">{msg.channel}</p>
                )}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-zinc-400">
              <span className="animate-pulse">ZeniClaw sedang mengetik...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 px-4 py-4 flex-shrink-0">
        {chatError && (
          <div className="max-w-3xl mx-auto mb-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {chatError}
          </div>
        )}
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tulis pesan..."
            disabled={sending}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}
