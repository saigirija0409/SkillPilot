import { Suspense } from "react";
import Link from "next/link";

import { AuthForm } from "@/components/auth/AuthForm";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabaseConfigured = isSupabaseBrowserConfigured();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12">
      <div className="mb-6 text-center">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          ← Back to SkillPilot Home
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Loading signup form...
          </div>
        }
      >
        <AuthForm mode="signup" supabaseConfigured={supabaseConfigured} />
      </Suspense>
    </main>
  );
}
