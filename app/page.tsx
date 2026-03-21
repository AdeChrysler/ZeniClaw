import Link from "next/link";

const features = [
  {
    icon: "☀️",
    title: "Daily Briefing",
    desc: "Morning summary of calendar, tasks, priorities, and key metrics — delivered to your WhatsApp before you start your day.",
  },
  {
    icon: "✅",
    title: "Task Management",
    desc: 'Create, assign, and track tasks via natural language. "Remind me to follow up with David on Friday" — done.',
  },
  {
    icon: "📧",
    title: "Email Triage",
    desc: "Inbox summary, draft responses, flag urgent items. You approve with a thumbs up — ZeniClaw sends it.",
  },
  {
    icon: "📅",
    title: "Meeting Prep",
    desc: "Auto-generated briefing docs with attendee context and last discussion notes — ready before every meeting.",
  },
  {
    icon: "🔍",
    title: "Research & Intel",
    desc: "On-demand competitor analysis, market research, company lookups. Ask anything, get answers in seconds.",
  },
  {
    icon: "👥",
    title: "Team Relay",
    desc: "Delegate tasks to your team via chat. ZeniClaw auto-follows-up if there's no response.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Rp 999K",
    period: "/bulan",
    usd: "~$60/mo",
    highlight: false,
    features: [
      "AI Executive Assistant",
      "WhatsApp channel",
      "Google Workspace integration",
      "Daily Briefing",
      "Task Management",
      "14-day free trial",
    ],
    cta: "Mulai Gratis",
  },
  {
    name: "Professional",
    price: "Rp 2,999K",
    period: "/bulan",
    usd: "~$180/mo",
    highlight: true,
    features: [
      "Everything in Starter",
      "WhatsApp + Telegram",
      "Unlimited integrations",
      "Team Relay",
      "Email Triage",
      "Priority support",
    ],
    cta: "Coba Sekarang",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    usd: "Hubungi kami",
    highlight: false,
    features: [
      "Dedicated instance",
      "Custom AI agents",
      "SLA guarantee",
      "On-premise option",
      "Custom integrations",
      "24/7 support",
    ],
    cta: "Hubungi Sales",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦅</span>
            <span className="font-bold text-xl tracking-tight">ZeniClaw</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </div>
          <Link
            href="/dashboard"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Mulai Sekarang →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 text-emerald-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Launching for Indonesian CEOs — 14-day free trial
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            AI Chief of Staff
            <br />
            <span className="text-emerald-400">di WhatsApp kamu</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            ZeniClaw adalah asisten eksekutif AI yang hidup di WhatsApp.
            Briefing pagi, manajemen tugas, triase email, dan relay tim — semua
            dari satu thread chat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg"
            >
              Coba Gratis 14 Hari →
            </Link>
            <a
              href="#features"
              className="border border-zinc-700 hover:border-zinc-500 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-colors"
            >
              Lihat Fitur
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Tidak perlu kartu kredit · Tidak perlu install app · Langsung di
            WhatsApp
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-10 border-y border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-zinc-500 text-sm mb-6">
            Dipercaya oleh para pemimpin bisnis di Indonesia
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-zinc-600 text-sm font-medium">
            {["CEO", "Founder", "Managing Director", "COO", "CTO"].map(
              (role) => (
                <span key={role} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  {role}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Satu asisten. Semua yang kamu butuhkan.
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              ZeniClaw menggabungkan 10+ tools yang kamu pakai sehari-hari ke
              dalam satu interface percakapan.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Mulai dalam 5 menit</h2>
            <p className="text-zinc-400 text-lg">
              Tidak ada app baru. Tidak ada dashboard yang perlu dipelajari.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Tambah ZeniClaw",
                desc: "Scan QR code untuk menghubungkan WhatsApp kamu",
              },
              {
                step: "2",
                title: "Onboarding Chat",
                desc: "ZeniClaw mengenal peran, tim, dan tools yang kamu pakai",
              },
              {
                step: "3",
                title: "Hubungkan Tools",
                desc: "Integrasikan Google Calendar, Email, CRM via secure link",
              },
              {
                step: "4",
                title: "ZeniClaw Bekerja",
                desc: "Briefing proaktif, asisten reaktif, 24/7",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 font-bold text-lg mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-zinc-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Harga Transparan</h2>
            <p className="text-zinc-400 text-lg">
              14 hari gratis untuk semua paket. Tidak perlu kartu kredit.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border relative ${
                  plan.highlight
                    ? "bg-emerald-950/50 border-emerald-500/50"
                    : "bg-zinc-900 border-zinc-800"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                    PALING POPULER
                  </div>
                )}
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <div className="mb-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-zinc-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-zinc-500 text-sm mb-6">{plan.usd}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/dashboard"
                  className={`block text-center font-semibold py-3 px-6 rounded-xl transition-all ${
                    plan.highlight
                      ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                      : "border border-zinc-700 hover:border-zinc-500 text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">
            Siap punya AI Chief of Staff?
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Bergabung dengan para CEO dan pendiri di Indonesia yang sudah
            menghemat 3 jam per hari dengan ZeniClaw.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg px-10 py-4 rounded-xl transition-all hover:scale-105"
          >
            Coba Gratis 14 Hari →
          </Link>
          <p className="mt-4 text-sm text-zinc-500">
            Tidak perlu kartu kredit · Batalkan kapan saja
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦅</span>
            <span className="font-bold">ZeniClaw</span>
            <span className="text-zinc-500 text-sm ml-2">
              by SixZenith — Zenova.id
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
