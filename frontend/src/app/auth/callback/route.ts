import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import {
  createSupabaseServerClient,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";

function getSafeRedirectPath(rawNext: string | null): string | null {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return null;
  }
  return rawNext;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const requestedNext = getSafeRedirectPath(searchParams.get("next"));

  if (!isSupabaseServerConfigured()) {
    return NextResponse.redirect(
      `${origin}/login?error=Supabase+is+not+configured`
    );
  }

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
  } else {
    return NextResponse.redirect(
      `${origin}/login?error=Invalid+or+expired+authentication+callback`
    );
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle<{ onboarding_completed: boolean }>();

      if (profile && !profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }
      if (profile?.onboarding_completed && !requestedNext) {
        return NextResponse.redirect(`${origin}/dashboard`);
      }
    }
  } catch {
    // Fall back safely below if profile lookup fails transiently.
  }

  return NextResponse.redirect(`${origin}${requestedNext ?? "/onboarding"}`);
}
