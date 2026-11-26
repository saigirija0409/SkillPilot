"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { signInWithEmail, signUpWithEmail } from "@/services/auth";

interface AuthFormProps {
  mode: "login" | "signup";
  supabaseConfigured: boolean;
}

export function AuthForm({ mode, supabaseConfigured }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const callbackError = searchParams.get("error");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(callbackError);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null
  );

  const isSignup = mode === "signup";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabaseConfigured) {
      setError("Supabase environment variables are not configured.");
      return;
    }

    setLoading(true);
    setError(null);
    setConfirmationMessage(null);

    try {
      if (isSignup) {
        if (fullName.trim().length < 2) {
          throw new Error("Please enter your full name (at least 2 characters).");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters long.");
        }

        const result = await signUpWithEmail({ email, password, fullName });
        if (result.requiresEmailConfirmation) {
          setConfirmationMessage(
            `Account created for ${result.email}. Check your inbox and click the confirmation link to activate your session.`
          );
        } else {
          router.push("/onboarding");
          router.refresh();
        }
      } else {
        await signInWithEmail({ email, password });
        const safeNext =
          nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
            ? nextPath
            : "/dashboard";
        router.push(safeNext);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {isSignup ? "Create your SkillPilot account" : "Sign in to SkillPilot"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {isSignup
            ? "New accounts start with learner/employee permissions."
            : "Access your personalized onboarding, skill profile, and dashboard."}
        </p>
      </div>

      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {confirmationMessage ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{confirmationMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup ? (
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-slate-700"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Rivera"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        ) : null}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isSignup ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            Need an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Create one
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
