"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type WAStatus = "STOPPED" | "STARTING" | "SCAN_QR_CODE" | "WORKING" | "FAILED" | "UNKNOWN";

interface StatusData {
  status: WAStatus;
  me?: { id: string; pushName: string } | null;
  error?: string;
}

const activities = [
  { time: "08:02", type: "briefing", msg: "Daily briefing delivered to WhatsApp" },
  { time: "09:15", type: "task", msg: 'Task created: "Follow up with investor" (deadline: Friday)' },
  { time: "10:30", type: "email", msg: "Email triaged: 3 urgent, 7 normal, 12 archived" },
  { time: "11:00", type: "meeting", msg: "Meeting prep ready: Board Review @ 2pm" },
  { time: "13:45", type: "relay", msg: 'Team relay sent to @marketing: "Q2 campaign brief needed by EOD"' },
];

const activityIcon: Record<string, string> = {
  briefing: "☀️",
  task: "✅",
  email: "📧",
  meeting: "📅",
  relay: "👥",
};

function StatusBadge({ status }: { status: WAStatus }) {
  const config: Record<WAStatus, { color: string; label: string; dot: string }> = {
    WORKING: { color: "text-emerald-400", label: "Connected", dot: "bg-emerald-400 animate-pulse" },
    SCAN_QR_CODE: { color: "text-yellow-400", label: "Scan QR Code", dot: "bg-yellow-400 animate-pulse" },
    STARTING: { color: "text-blue-400", label: "Starting...", dot: "bg-blue-400 animate-spin" },
    STOPPED: { color: "text-zinc-500", label: "Disconnected", dot: "bg-zinc-500" },
    FAILED: { color: "text-red-400", label: "Failed", dot: "bg-red-400" },
    UNKNOWN: { color: "text-zinc-500", label: "Unknown", dot: "bg-zinc-600" },
  };
  const c = config[status] || config.UNKNOWN;
  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${c.color}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {c.label}
    </div>
  );
}

export default function Dashboard() {
  const [waStatus, setWaStatus] = useState<StatusData>({ status: "STOPPED" });
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [qrTs, setQrTs] = useState(Date.now());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp?action=status", { cache: "no-store" });
      const data: StatusData = await res.json();
      setWaStatus(data);
    } catch {
      setWaStatus({ status: "STOPPED", error: "Service unavailable" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const startSession = async () => {
    setStarting(true);
    try {
      await fetch("/api/whatsapp?action=start", { method: "POST" });
      await fetchStatus();
      setQrTs(Date.now());
    } finally {
      setStarting(false);
    }
  };

  const showQR = waStatus.status === "SCAN_QR_CODE" || waStatus.status === "STARTING";
  const isConnected = waStatus.status === "WORKING";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🦅</span>
              <span className="font-bold text-xl tracking-tight">ZeniClaw</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 text-sm">Dashboard</span>
          </div>
          <Link
            href="/#pricing"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Upgrade Plan
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* WhatsApp status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400 font-medium">WhatsApp</span>
              <span className="text-xl">📱</span>
            </div>
            {loading ? (
              <div className="h-5 w-24 bg-zinc-800 rounded animate-pulse" />
            ) : (
              <StatusBadge status={waStatus.status} />
            )}
            {isConnected && waStatus.me && (
              <p className="text-xs text-zinc-500 mt-1">+{waStatus.me.id?.split("@")[0]}</p>
            )}
          </div>

          {/* AI Agent status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400 font-medium">ZeniClaw Agent</span>
              <span className="text-xl">🤖</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </div>
            <p className="text-xs text-zinc-500 mt-1">Claude Sonnet · Multi-agent</p>
          </div>

          {/* Activity count */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-zinc-400 font-medium">Today&apos;s Activity</span>
              <span className="text-xl">📊</span>
            </div>
            <div className="text-2xl font-bold">{activities.length}</div>
            <p className="text-xs text-zinc-500 mt-1">Actions completed today</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WhatsApp QR Panel */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1">WhatsApp Connection</h2>
            <p className="text-sm text-zinc-400 mb-6">
              Hubungkan WhatsApp kamu untuk mulai menggunakan ZeniClaw.
            </p>

            {isConnected ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">✅</div>
                <p className="font-semibold text-emerald-400 text-lg">WhatsApp Terhubung</p>
                {waStatus.me && (
                  <p className="text-zinc-400 text-sm mt-1">
                    {waStatus.me.pushName} (+{waStatus.me.id?.split("@")[0]})
                  </p>
                )}
                <p className="text-zinc-500 text-sm mt-4">
                  ZeniClaw sudah aktif dan siap membantu kamu.
                </p>
              </div>
            ) : showQR ? (
              <div className="text-center">
                <p className="text-sm text-zinc-400 mb-4">
                  Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat → Scan QR
                </p>
                <div className="inline-block bg-white p-3 rounded-xl mb-4">
                  {qrError ? (
                    <div className="w-48 h-48 flex items-center justify-center bg-zinc-100 rounded">
                      <p className="text-zinc-500 text-xs text-center px-4">
                        QR loading...
                        <br />
                        Refresh in a moment
                      </p>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/whatsapp?action=qr&t=${qrTs}`}
                      alt="WhatsApp QR Code"
                      width={192}
                      height={192}
                      className="w-48 h-48"
                      onError={() => setQrError(true)}
                      onLoad={() => setQrError(false)}
                    />
                  )}
                </div>
                <p className="text-xs text-zinc-500">QR code refreshes automatically every 30s</p>
                <button
                  onClick={() => setQrTs(Date.now())}
                  className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 underline"
                >
                  Refresh QR
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📱</div>
                <p className="text-zinc-400 mb-6 text-sm">
                  Klik tombol di bawah untuk memulai dan mendapatkan QR code.
                </p>
                <button
                  onClick={startSession}
                  disabled={starting}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  {starting ? "Memulai..." : "Hubungkan WhatsApp"}
                </button>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1">Activity Feed</h2>
            <p className="text-sm text-zinc-400 mb-6">Aktivitas ZeniClaw hari ini</p>

            {isConnected ? (
              <div className="space-y-4">
                {activities.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 pb-4 border-b border-zinc-800 last:border-0 last:pb-0"
                  >
                    <span className="text-lg mt-0.5">{activityIcon[a.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 leading-snug">{a.msg}</p>
                      <p className="text-xs text-zinc-500 mt-1">{a.time} · Today</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-zinc-500 text-sm">
                  Hubungkan WhatsApp untuk melihat aktivitas ZeniClaw kamu.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "☀️", label: "Request Briefing", desc: "Kirim briefing sekarang" },
              { icon: "✅", label: "Add Task", desc: "Tambah task baru" },
              { icon: "📧", label: "Triage Email", desc: "Ringkasan inbox kamu" },
              { icon: "⚙️", label: "Settings", desc: "Konfigurasi ZeniClaw" },
            ].map((a) => (
              <button
                key={a.label}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl p-4 text-left transition-colors group"
                onClick={() => alert("Feature coming soon! Connect WhatsApp to get started.")}
              >
                <div className="text-2xl mb-2">{a.icon}</div>
                <div className="font-medium text-sm">{a.label}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{a.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Getting started notice */}
        {!isConnected && (
          <div className="mt-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 flex items-start gap-4">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-emerald-400 mb-1">
                Mulai dengan menghubungkan WhatsApp
              </h3>
              <p className="text-sm text-zinc-400">
                Scan QR code di panel sebelah kiri untuk mengaktifkan ZeniClaw. Setelah terhubung,
                kirim pesan &ldquo;/start&rdquo; ke ZeniClaw di WhatsApp untuk memulai onboarding.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
