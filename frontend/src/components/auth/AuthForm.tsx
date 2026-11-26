"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

import { Button, Card, Input } from "@/components/ui";
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
  const [showPassword, setShowPassword] = useState(false);
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
          throw new Error(
            "Please enter your full name (at least 2 characters)."
          );
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
    <Card padding="lg" className="w-full">
      <div className="mb-7 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forest">
          {isSignup ? "Create Learner Account" : "Welcome Back"}
        </p>
        <h1 className="font-editorial text-4xl leading-tight text-ink">
          {isSignup ? (
            <>
              Begin your <span className="italic text-forest">SkillPilot</span>{" "}
              journey
            </>
          ) : (
            <>
              Sign in to <span className="italic text-forest">SkillPilot</span>
            </>
          )}
        </h1>
        <p className="text-[14px] sm:text-[15px] leading-relaxed text-muted">
          {isSignup
            ? "New accounts start with standard learner permissions. Organization roles are assigned securely by administrators."
            : "Access your guided onboarding, skill intelligence, and personalized roadmap."}
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] p-3.5 text-sm text-[var(--status-attention-text)]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {confirmationMessage ? (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-[var(--status-verified-border)] bg-[var(--status-verified-bg)] p-3.5 text-sm text-[var(--status-verified-text)]"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{confirmationMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup ? (
          <Input
            label="Full Name"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Aarav Sharma"
          />
        ) : null}

        <Input
          label="Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <div className="space-y-1.5">
          <label
            htmlFor="auth-password"
            className="block text-sm sm:text-[15px] font-semibold text-ink"
          >
            Password <span className="ml-0.5 text-[#A14B2C]">*</span>
          </label>
          <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full rounded-xl border border-line-strong bg-surface px-4 py-3 pr-11 text-[15px] sm:text-base text-ink placeholder:text-muted/75 transition focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:bg-surface-muted hover:text-ink cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[13px] text-muted">
            Use at least 8 characters for account security.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="mt-2 w-full"
        >
          {isSignup ? "Create Account" : "Sign In"}
        </Button>
      </form>

      <div className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-forest hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to SkillPilot?{" "}
            <Link
              href="/signup"
              className="font-semibold text-forest hover:underline underline-offset-4"
            >
              Create an account
            </Link>
          </>
        )}
      </div>
    </Card>
  );
}
