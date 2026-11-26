import { Suspense } from "react";

import { RoadmapPreviewView } from "@/components/employee/RoadmapPreviewView";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";

async function EmployeeRoadmapInner() {
  const { user } = await requireServerUser("/login?next=/employee/roadmap");
  return <RoadmapPreviewView userId={user.id} />;
}

export default function EmployeeRoadmapPage() {
  return (
    <Suspense fallback={<SkeletonCard />}>
      <EmployeeRoadmapInner />
    </Suspense>
  );
}
