import { Suspense } from "react";

import { CopilotView } from "@/components/employee/CopilotView";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";

async function EmployeeCopilotInner() {
  const { user } = await requireServerUser("/login?next=/employee/copilot");
  return <CopilotView userId={user.id} />;
}

export default function EmployeeCopilotPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <EmployeeCopilotInner />
    </Suspense>
  );
}
