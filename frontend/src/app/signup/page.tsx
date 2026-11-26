import { Suspense } from "react";

import { AuthForm } from "@/components/auth/AuthForm";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { SkeletonCard } from "@/components/ui";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabaseConfigured = isSupabaseBrowserConfigured();

  return (
    <AuthSplitShell eyebrow="New Account">
      <Suspense fallback={<SkeletonCard />}>
        <AuthForm mode="signup" supabaseConfigured={supabaseConfigured} />
      </Suspense>
    </AuthSplitShell>
  );
}
