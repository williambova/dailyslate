import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser Supabase client. Reads public env vars (safe to expose):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * If they're not set, `supabase` is null and the whole app falls back to
 * guest / local mode — so the site never breaks before the backend is wired.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anon as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
