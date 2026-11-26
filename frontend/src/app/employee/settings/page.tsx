import { Suspense } from "react";

import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";

async function EmployeeSettingsInner() {
  const { user } = await requireServerUser("/login?next=/employee/settings");
  return <ProfileEditor userId={user.id} />;
}

export default function EmployeeSettingsPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <EmployeeSettingsInner />
    </Suspense>
  );
}
