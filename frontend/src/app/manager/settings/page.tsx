import { Suspense } from "react";

import { ManagerSettingsView } from "@/components/manager/ManagerSettingsView";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";

async function ManagerSettingsInner() {
  const { user } = await requireServerUser("/login?next=/manager/settings");
  return <ManagerSettingsView userId={user.id} />;
}

export default function ManagerSettingsPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <ManagerSettingsInner />
    </Suspense>
  );
}
