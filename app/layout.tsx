import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ZeniClaw — AI Executive Assistant on WhatsApp",
  description:
    "Your always-on AI Chief of Staff. Runs your business from WhatsApp — briefings, tasks, email triage, team relay, and more.",
  openGraph: {
    title: "ZeniClaw — AI Executive Assistant on WhatsApp",
    description:
      "Your always-on AI Chief of Staff. Runs your business from WhatsApp.",
    siteName: "ZeniClaw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  );
}
