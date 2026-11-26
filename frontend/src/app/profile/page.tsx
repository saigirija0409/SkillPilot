import { Suspense } from "react";
import { redirect } from "next/navigation";

import { requireServerUser } from "@/lib/auth/server";

async function ProfileRedirectInner() {
  const { profile } = await requireServerUser("/login?next=/profile");
  if (
    profile?.account_type === "manager" ||
    profile?.account_type === "admin"
  ) {
    return redirect("/manager/settings");
  }
  return redirect("/employee/settings");
}

export default function ProfileRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas px-6 text-sm text-muted">
          Opening settings...
        </div>
      }
    >
      <ProfileRedirectInner />
    </Suspense>
  );
}
