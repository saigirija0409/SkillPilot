import Link from "next/link";

import { BackendConnectivityCard } from "@/components/status/BackendConnectivityCard";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-12">
      <header className="mb-8">
        <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          Phase 2 — Auth, Database, RLS &amp; Onboarding
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          SkillPilot
        </h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600">
          Agentic AI-Powered Upskilling and Workforce Intelligence Platform.
          Sign up or log in to complete onboarding, manage your skill profile,
          and verify end-to-end authentication with FastAPI.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            Create Account
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            Open Dashboard
          </Link>
        </div>
      </header>

      <BackendConnectivityCard />

      <footer className="mt-8 rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500">
        Phase 2 includes Supabase Auth, Row Level Security migrations, private
        PDF resume storage, FastAPI JWT validation, and multi-step onboarding.
      </footer>
    </main>
  );
}
