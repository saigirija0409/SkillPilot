import { Suspense } from "react";

import { AuthForm } from "@/components/auth/AuthForm";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { SkeletonCard } from "@/components/ui";
import { isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabaseConfigured = isSupabaseBrowserConfigured();

  return (
    <AuthSplitShell eyebrow="Member Sign In">
      <Suspense fallback={<SkeletonCard />}>
        <AuthForm mode="login" supabaseConfigured={supabaseConfigured} />
      </Suspense>
    </AuthSplitShell>
  );
}
