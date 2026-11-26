import React, { Suspense } from "react";
import { redirect } from "next/navigation";

import { EmployeePortalShell } from "@/components/portal/EmployeePortalShell";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";
import type { AccountType } from "@/types/database";

async function EmployeeLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, profileLoadError } = await requireServerUser(
    "/login?next=/employee/overview"
  );

  const isPrivilegedManager =
    profile?.account_type === "manager" || profile?.account_type === "admin";

  if (profile && !profile.onboarding_completed && !isPrivilegedManager) {
    redirect("/onboarding");
  }

  const accountType: AccountType = profile?.account_type ?? "learner";
  const email = user.email ?? profile?.email ?? "Authenticated User";
  const fullName = profile?.full_name || email;

  return (
    <EmployeePortalShell
      userEmail={email}
      fullName={fullName}
      accountType={accountType}
    >
      {profileLoadError ? (
        <div className="mb-6 rounded-2xl border border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] p-4 text-sm text-[var(--status-attention-text)]">
          <p className="font-semibold">Unable to load full profile record</p>
          <p className="mt-1 text-xs">{profileLoadError}</p>
        </div>
      ) : null}
      {children}
    </EmployeePortalShell>
  );
}

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-12">
          <SkeletonCard />
        </div>
      }
    >
      <EmployeeLayoutInner>{children}</EmployeeLayoutInner>
    </Suspense>
  );
}
