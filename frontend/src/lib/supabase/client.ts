import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

function getSupabasePublicConfig(): { url: string; key: string } | null {
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

export function isSupabaseBrowserConfigured(): boolean {
  return getSupabasePublicConfig() !== null;
}

export function createSupabaseBrowserClient(): SupabaseClient {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      "Supabase browser client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in frontend/.env.local."
    );
  }
  return createBrowserClient(config.url, config.key);
}
