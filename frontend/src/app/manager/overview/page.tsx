import { Suspense } from "react";

import { ManagerOverviewView } from "@/components/manager/ManagerOverviewView";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";
import type { AccountType } from "@/types/database";

async function ManagerOverviewInner() {
  const { user, profile } = await requireServerUser(
    "/login?next=/manager/overview"
  );
  const accountType: AccountType = profile?.account_type ?? "learner";
  const fullName = profile?.full_name || user.email || "Manager";
  return (
    <ManagerOverviewView
      fullName={fullName}
      accountType={accountType}
      organizationId={profile?.organization_id ?? null}
    />
  );
}

export default function ManagerOverviewPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <ManagerOverviewInner />
    </Suspense>
  );
}
