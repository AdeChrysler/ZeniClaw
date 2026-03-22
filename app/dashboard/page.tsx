"use client";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardData {
  user: { name: string; email: string; plan: string; trialEndsAt: string | null };
  whatsapp: { status: string; phoneNumber: string | null; pushName: string | null };
  telegram: { status: string; username: string | null; linkCode: string | null; botToken: string | null; botUsername: string | null };
  stats: { messagesToday: number; activeConnections: number };
  recentMessages: Array<{ id: string; channel: string; role: string; content: string; createdAt: string }>;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState("");
  const [savingToken, setSavingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const waStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Dedicated QR polling — runs every 3s while status is "connecting"
  useEffect(() => {
    if (waStatusRef.current !== "connecting") return;
    const interval = setInterval(() => {
      setQrUrl(`/api/whatsapp?action=qr&t=${Date.now()}`);
      setQrLoading(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [waStatusRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchDashboard() {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        setDashboardError("Gagal memuat dashboard. Silakan muat ulang halaman.");
        return;
      }
      setDashboardError(null);
      const d = await res.json();
      setData(d);
      waStatusRef.current = d.whatsapp?.status ?? null;

      if (d.whatsapp?.status === "connecting") {
        setQrUrl(`/api/whatsapp?action=qr&t=${Date.now()}`);
        setQrLoading(true);
      } else if (d.whatsapp?.status === "connected") {
        setQrUrl(null);
        setQrLoading(false);
      }
    } catch (err) {
      console.error(err);
      setDashboardError("Gagal memuat dashboard. Periksa koneksi internet kamu.");
    } finally {
      setLoading(false);
    }
  }

  async function connectWhatsApp() {
    setConnecting(true);
    try {
      const res = await fetch("/api/whatsapp?action=start", { method: "POST" });
      if (!res.ok) {
        setDashboardError("Gagal memulai sesi WhatsApp. Pastikan layanan WAHA aktif.");
      }
      await fetchDashboard();
    } catch {
      setDashboardError("Gagal menghubungkan WhatsApp. Periksa koneksi internet kamu.");
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectWhatsApp() {
    try {
      setDisconnectError(null);
      const res = await fetch("/api/whatsapp?action=disconnect", { method: "POST" });
      if (!res.ok) {
        setDisconnectError("Gagal memutuskan koneksi WhatsApp. Coba lagi.");
        return;
      }
      await fetchDashboard();
    } catch (err) {
      console.error(err);
      setDisconnectError("Terjadi kesalahan. Silakan coba lagi.");
    }
  }

  async function generateTelegramCode() {
    await fetch("/api/telegram?action=generate-code");
    await fetchDashboard();
  }

  async function saveBotToken() {
    setSavingToken(true);
    setTokenError(null);
    try {
      const res = await fetch("/api/telegram?action=save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botTokenInput.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        setTokenError(d.error || "Gagal menyimpan token");
      } else {
        setBotTokenInput("");
        await fetchDashboard();
      }
    } catch {
      setTokenError("Gagal menyimpan token");
    } finally {
      setSavingToken(false);
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

  const wa = data?.whatsapp;
  const tg = data?.telegram;
  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top Bar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold text-emerald-400">ZeniClaw</div>
          <Link href="/chat" className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors">Web Chat</Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{session.user?.name || session.user?.email}</span>
          {data?.user?.plan === "free_trial" && (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Trial</span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Keluar
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {dashboardError && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {dashboardError}
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Pesan Hari Ini" value={String(stats?.messagesToday ?? 0)} />
          <StatCard label="Koneksi Aktif" value={`${stats?.activeConnections ?? 0}/2`} />
          <StatCard label="WhatsApp" value={wa?.status === "connected" ? "Terhubung" : wa?.status === "connecting" ? "Menghubungkan" : "Terputus"} />
          <StatCard label="Telegram" value={tg?.status === "connected" ? "Terhubung" : "Menunggu"} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* WhatsApp Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">WhatsApp</h2>
            {wa?.status === "connected" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  <span className="text-emerald-400 font-medium">Terhubung</span>
                </div>
                {wa.pushName && <p className="text-zinc-300">{wa.pushName}</p>}
                {wa.phoneNumber && <p className="text-zinc-400 text-sm">+{wa.phoneNumber}</p>}
                <button
                  onClick={disconnectWhatsApp}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors mt-2"
                >
                  Putuskan Koneksi
                </button>
                {disconnectError && <p className="text-red-400 text-xs mt-1">{disconnectError}</p>}
              </div>
            ) : wa?.status === "connecting" ? (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">Scan QR code dengan WhatsApp kamu:</p>
                <div className="w-48 h-48 bg-white p-2 rounded-xl flex items-center justify-center">
                  {qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={qrUrl}
                      src={qrUrl}
                      alt="QR Code"
                      className="w-full h-full object-contain"
                      onLoad={() => setQrLoading(false)}
                      onError={() => {
                        setQrLoading(false);
                        // Don't clear URL — keep retrying on next poll
                      }}
                    />
                  ) : (
                    <div className="text-zinc-400 text-xs text-center">Memuat QR...</div>
                  )}
                </div>
                {qrLoading && <p className="text-zinc-500 text-xs">Memuat QR code...</p>}
                {!qrLoading && qrUrl && <p className="text-zinc-500 text-xs">QR akan diperbarui otomatis setiap 3 detik</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">Hubungkan WhatsApp untuk memulai AI Assistant kamu.</p>
                <button
                  onClick={connectWhatsApp}
                  disabled={connecting}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  {connecting ? "Menghubungkan..." : "Hubungkan WhatsApp"}
                </button>
              </div>
            )}
          </div>

          {/* Telegram Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Telegram</h2>
            {!tg?.botToken ? (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">Masukkan token bot Telegram kamu. Buat bot baru via <span className="text-blue-400">@BotFather</span> di Telegram, lalu copy token-nya di sini.</p>
                <input
                  type="text"
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  placeholder="1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
                {tokenError && <p className="text-red-400 text-xs">{tokenError}</p>}
                <button
                  onClick={saveBotToken}
                  disabled={savingToken || !botTokenInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  {savingToken ? "Menyimpan..." : "Simpan Token Bot"}
                </button>
              </div>
            ) : tg?.status === "connected" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-400 font-medium">Terhubung</span>
                </div>
                {tg.username && <p className="text-zinc-300">@{tg.username}</p>}
                {tg.botUsername && <p className="text-zinc-500 text-xs">Bot: @{tg.botUsername}</p>}
                <button
                  onClick={() => { setBotTokenInput(""); setData(d => d ? { ...d, telegram: { ...d.telegram, botToken: null } } : d); }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Ganti bot token
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tg.botUsername && <p className="text-zinc-400 text-sm">Bot: <span className="text-blue-400">@{tg.botUsername}</span></p>}
                <p className="text-zinc-400 text-sm">Hubungkan Telegram dengan mengirim kode ini ke bot kamu:</p>
                {tg?.linkCode ? (
                  <div className="space-y-3">
                    <div className="bg-zinc-800 rounded-xl p-4 font-mono text-lg text-center tracking-widest text-emerald-400">
                      /start {tg.linkCode}
                    </div>
                    <p className="text-zinc-500 text-xs">Kirim perintah di atas ke bot Telegram kamu</p>
                  </div>
                ) : (
                  <button
                    onClick={generateTelegramCode}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Generate Kode Link
                  </button>
                )}
                <button
                  onClick={() => setData(d => d ? { ...d, telegram: { ...d.telegram, botToken: null } } : d)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors block"
                >
                  Ganti bot token
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Riwayat Pesan</h2>
          {data?.recentMessages && data.recentMessages.length > 0 ? (
            <div className="space-y-3">
              {data.recentMessages.slice(0, 10).map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${msg.role === "user" ? "bg-blue-400" : "bg-emerald-400"}`}></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-500 capitalize">{msg.channel}</span>
                      <span className="text-xs text-zinc-600">·</span>
                      <span className="text-xs text-zinc-500">{msg.role === "user" ? "Kamu" : "ZeniClaw"}</span>
                    </div>
                    <p className="text-zinc-300 text-sm truncate">{msg.content}</p>
                  </div>
                  <span className="text-xs text-zinc-600 flex-shrink-0">
                    {new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Belum ada pesan. Hubungkan WhatsApp atau Telegram untuk mulai.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <p className="text-zinc-500 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}
