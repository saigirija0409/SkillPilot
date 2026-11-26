import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { User } from "@supabase/supabase-js";

import {
  createSupabaseServerClient,
  isSupabaseServerConfigured,
} from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getOptionalServerUser(): Promise<User | null> {
  await connection();
  if (!isSupabaseServerConfigured()) {
    return null;
  }
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function requireServerUser(redirectTo = "/login"): Promise<{
  user: User;
  profile: Profile | null;
  profileLoadError: string | null;
}> {
  // Halt Next.js prerendering before any Supabase client/session timestamp logic runs.
  await connection();

  if (!isSupabaseServerConfigured()) {
    redirect("/login?error=Supabase+is+not+configured");
  }

  const supabase = await createSupabaseServerClient();

  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      user = data.user;
    }
  } catch {
    redirect("/login?error=Unable+to+reach+authentication+service");
  }

  if (!user) {
    redirect(redirectTo);
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    if (profileError) {
      return {
        user,
        profile: null,
        profileLoadError: profileError.message,
      };
    }

    return {
      user,
      profile: profile ?? null,
      profileLoadError: null,
    };
  } catch (err) {
    return {
      user,
      profile: null,
      profileLoadError:
        err instanceof Error ? err.message : "Unable to load profile record",
    };
  }
}
