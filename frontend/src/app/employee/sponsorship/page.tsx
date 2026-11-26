import { Suspense } from "react";

import { SponsorshipView } from "@/components/employee/SponsorshipView";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";

async function EmployeeSponsorshipInner() {
  const { user, profile } = await requireServerUser(
    "/login?next=/employee/sponsorship"
  );
  const name = profile?.full_name || user.email || "SkillPilot Learner";
  return <SponsorshipView requesterName={name} />;
}

export default function EmployeeSponsorshipPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <EmployeeSponsorshipInner />
    </Suspense>
  );
}
