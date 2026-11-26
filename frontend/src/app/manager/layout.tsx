import React, { Suspense } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { ManagerPortalShell } from "@/components/portal/ManagerPortalShell";
import {
  BrandLogo,
  Button,
  Card,
  SkeletonCard,
  StatusLabel,
} from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";
import type { AccountType } from "@/types/database";

async function ManagerLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, profileLoadError } = await requireServerUser(
    "/login?next=/manager/overview"
  );

  const accountType: AccountType = profile?.account_type ?? "learner";
  const email = user.email ?? profile?.email ?? "Authenticated User";
  const fullName = profile?.full_name || email;
  const isAuthorizedManager =
    accountType === "manager" || accountType === "admin";

  // Strictly block manager navigation and portal access for unauthorized learners/employees
  if (!isAuthorizedManager) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
        <div className="mb-6">
          <BrandLogo size="sm" />
        </div>

        <Card padding="lg" className="w-full max-w-lg">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--status-attention-border)] bg-[var(--status-attention-bg)] text-[var(--status-attention-text)]">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <StatusLabel tone="attention" label="403 • Access Restricted" />
              <h1 className="font-editorial text-3xl text-ink">
                Manager portal requires{" "}
                <span className="italic text-forest">authorized</span> access.
              </h1>
              <p className="text-sm leading-relaxed text-muted">
                Your authenticated role is{" "}
                <strong className="uppercase text-ink">{accountType}</strong>.
                Manager permissions and organization memberships are assigned
                administratively in Supabase and cannot be granted client-side.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/employee/overview">
                  <Button variant="primary" size="sm">
                    Go to Employee Portal
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary" size="sm">
                    Return Home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ManagerPortalShell
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
    </ManagerPortalShell>
  );
}

export default function ManagerLayout({
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
      <ManagerLayoutInner>{children}</ManagerLayoutInner>
    </Suspense>
  );
}
