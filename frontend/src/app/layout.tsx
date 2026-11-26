import type { Metadata } from "next";
import { Instrument_Serif, Manrope } from "next/font/google";

import { MotionProvider } from "@/components/ui/MotionPrimitives";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillPilot — Agentic AI Upskilling & Workforce Intelligence",
  description:
    "AI-powered career skill-gap analysis, personalized learning roadmaps, and real-time workforce intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-canvas font-sans text-ink selection:bg-pistachio selection:text-ink">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
