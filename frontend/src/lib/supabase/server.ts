import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getSupabaseServerConfig(): { url: string; key: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const url = rawUrl ? rawUrl.trim() : "";
  const key = rawKey ? rawKey.trim() : "";

  if (
    !url ||
    !key ||
    url === "https://your-project-ref.supabase.co" ||
    key === "your-supabase-publishable-key"
  ) {
    return null;
  }

  return { url, key };
}

export function isSupabaseServerConfigured(): boolean {
  return getSupabaseServerConfig() !== null;
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const config = getSupabaseServerConfig();
  if (!config) {
    throw new Error(
      "Supabase server client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in frontend/.env.local."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies directly; middleware handles refresh in Phase 2.
        }
      },
    },
  });
}
