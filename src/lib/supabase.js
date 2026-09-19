import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseEnabled = Boolean(url && anonKey);
let client = null;
if (isSupabaseEnabled) {
    client = createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true },
    });
}
/**
 * Supabase client. `null` when env vars are missing — the app then runs
 * in built-in DEMO MODE (local seeded data), so `npm run dev` works
 * with zero configuration.
 */
export const supabase = client;
