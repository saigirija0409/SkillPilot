import React, { Suspense } from "react";
import { redirect } from "next/navigation";

import { AppNav } from "@/components/layout/AppNav";
import { requireServerUser } from "@/lib/auth/server";
import type { AccountType, Profile } from "@/types/database";

interface ProtectedPageShellProps {
  loginRedirect: string;
  requireCompletedOnboarding?: boolean;
  renderContent: (ctx: {
    userId: string;
    email: string;
    accountType: AccountType;
    organizationId: string | null;
    profile: Profile | null;
  }) => React.ReactNode;
}

async function AuthenticatedInner({
  loginRedirect,
  requireCompletedOnboarding = false,
  renderContent,
}: ProtectedPageShellProps) {
  const { user, profile, profileLoadError } =
    await requireServerUser(loginRedirect);

  if (requireCompletedOnboarding && profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const accountType: AccountType = profile?.account_type ?? "learner";
  const email = user.email ?? profile?.email ?? "Authenticated User";

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav userEmail={email} accountType={accountType} />
      <main className="mx-auto max-w-5xl px-6 py-8">
        {profileLoadError ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Unable to load full profile record</p>
            <p className="mt-1 text-xs text-amber-800">{profileLoadError}</p>
          </div>
        ) : null}

        {renderContent({
          userId: user.id,
          email,
          accountType,
          organizationId: profile?.organization_id ?? null,
          profile,
        })}
      </main>
    </div>
  );
}

export function ProtectedPageShell(props: ProtectedPageShellProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-12 text-sm text-slate-600">
          Verifying session...
        </div>
      }
    >
      <AuthenticatedInner {...props} />
    </Suspense>
  );
}
