import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const AUTH_TIMEOUT_MS = 15000;

export interface AuthActionResult {
  requiresEmailConfirmation: boolean;
  email: string;
}

async function withAuthTimeout<T>(
  promise: Promise<T>,
  actionLabel: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(
              `${actionLabel} timed out. Please check your internet connection and try again.`
            )
          );
        }, AUTH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function normalizeAuthError(err: unknown): Error {
  if (err instanceof Error) {
    if (
      err.message.includes("Failed to fetch") ||
      err.message.includes("NetworkError")
    ) {
      return new Error(
        "Unable to reach Supabase authentication service. Check your network connection and try again."
      );
    }
    return err;
  }
  return new Error("Authentication request failed.");
}

export async function signUpWithEmail(params: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthActionResult> {
  const supabase = createSupabaseBrowserClient();
  const redirectOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  try {
    const { data, error } = await withAuthTimeout(
      supabase.auth.signUp({
        email: params.email.trim(),
        password: params.password,
        options: {
          data: {
            full_name: params.fullName.trim(),
          },
          ...(redirectOrigin
            ? { emailRedirectTo: `${redirectOrigin}/auth/callback` }
            : {}),
        },
      }),
      "Sign up"
    );

    if (error) {
      throw new Error(error.message);
    }

    return {
      requiresEmailConfirmation: !data.session,
      email: params.email.trim(),
    };
  } catch (err) {
    throw normalizeAuthError(err);
  }
}

export async function signInWithEmail(params: {
  email: string;
  password: string;
}): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  try {
    const { error } = await withAuthTimeout(
      supabase.auth.signInWithPassword({
        email: params.email.trim(),
        password: params.password,
      }),
      "Sign in"
    );

    if (error) {
      throw new Error(error.message);
    }
  } catch (err) {
    throw normalizeAuthError(err);
  }
}

export async function signOutUser(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  try {
    const { error } = await withAuthTimeout(supabase.auth.signOut(), "Sign out");
    if (error) {
      throw new Error(error.message);
    }
  } catch (err) {
    throw normalizeAuthError(err);
  }
}

export async function getCurrentSessionAccessToken(): Promise<string | null> {
  try {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
      error,
    } = await withAuthTimeout(
      supabase.auth.getSession(),
      "Session lookup"
    );
    if (error || !session) {
      return null;
    }
    return session.access_token;
  } catch {
    return null;
  }
}
