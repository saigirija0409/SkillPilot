import { Suspense } from "react";

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { SkeletonCard } from "@/components/ui";
import { requireServerUser } from "@/lib/auth/server";

async function OnboardingInner() {
  const { user, profile } = await requireServerUser("/login?next=/onboarding");
  const email = user.email ?? profile?.email ?? "Learner";
  return <OnboardingWizard userId={user.id} userEmail={email} />;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-14">
          <SkeletonCard />
        </div>
      }
    >
      <OnboardingInner />
    </Suspense>
  );
}
