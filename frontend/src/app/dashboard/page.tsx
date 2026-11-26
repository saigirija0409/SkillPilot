import { Suspense } from "react";
import { redirect } from "next/navigation";

import { requireServerUser } from "@/lib/auth/server";

async function DashboardRedirectInner() {
  const { profile } = await requireServerUser("/login?next=/dashboard");

  if (
    profile?.account_type === "manager" ||
    profile?.account_type === "admin"
  ) {
    return redirect("/manager/overview");
  }

  if (profile && !profile.onboarding_completed) {
    return redirect("/onboarding");
  }

  return redirect("/employee/overview");
}

export default function DashboardRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas px-6 text-sm text-muted">
          Directing you to your workspace...
        </div>
      }
    >
      <DashboardRedirectInner />
    </Suspense>
  );
}
