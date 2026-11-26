import { Suspense } from "react";

import { EmployeeDashboardView } from "@/components/dashboard/EmployeeDashboardView";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";

async function EmployeeOverviewInner() {
  const { user } = await requireServerUser("/login?next=/employee/overview");
  return <EmployeeDashboardView userId={user.id} />;
}

export default function EmployeeOverviewPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <EmployeeOverviewInner />
    </Suspense>
  );
}
