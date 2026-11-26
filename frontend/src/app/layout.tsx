import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
