import { Suspense } from "react";

import { SkillPassportView } from "@/components/employee/SkillPassportView";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";

async function EmployeePassportInner() {
  const { user } = await requireServerUser("/login?next=/employee/passport");
  return <SkillPassportView userId={user.id} />;
}

export default function EmployeePassportPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <EmployeePassportInner />
    </Suspense>
  );
}
