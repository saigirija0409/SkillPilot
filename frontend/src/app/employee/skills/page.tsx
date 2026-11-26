import { Suspense } from "react";

import { SkillIntelligenceView } from "@/components/employee/SkillIntelligenceView";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";

async function EmployeeSkillsInner() {
  const { user } = await requireServerUser("/login?next=/employee/skills");
  return <SkillIntelligenceView userId={user.id} />;
}

export default function EmployeeSkillsPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <EmployeeSkillsInner />
    </Suspense>
  );
}
