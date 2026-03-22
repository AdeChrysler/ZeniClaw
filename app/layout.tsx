import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZeniClaw — AI Executive Assistant on WhatsApp",
  description: "AI Chief of Staff untuk CEO dan profesional. Kelola bisnis dari satu chat.",
  openGraph: {
    title: "ZeniClaw — AI Executive Assistant on WhatsApp",
    description: "AI Chief of Staff untuk CEO dan profesional",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-zinc-950 text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
