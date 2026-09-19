import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseEnabled = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

if (isSupabaseEnabled) {
  client = createClient(url as string, anonKey as string, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

/**
 * Supabase client. `null` when env vars are missing — the app then runs
 * in built-in DEMO MODE (local seeded data), so `npm run dev` works
 * with zero configuration.
 */
export const supabase: SupabaseClient | null = client;
