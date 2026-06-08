/**
 * Phase A — Real browser Supabase AUTH client (feature-flagged, dev-safe).
 *
 * This is a SEPARATE client from the read-only ticket-data client in
 * `src/data/readOnlyTicketData.ts`. That client deliberately disables auth
 * (persistSession:false, detectSessionInUrl:false) for anonymous reads; this one
 * is the opposite — a real auth client that persists sessions and handles OAuth.
 *
 * Everything here is gated behind `VITE_WSS_REAL_AUTH_ENABLED === "true"`:
 *   - When the flag is off, `getAuthClient()` returns null and no Supabase Auth
 *     call is ever made. The app falls back to existing behavior.
 *   - No secrets are embedded. Only the public anon key + project URL are read
 *     from env. The service-role key is never used in the browser.
 *
 * This module performs no operator/customer linking, creates no records, and does
 * not enable RLS. It only establishes the ability to obtain a verified session.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface AuthEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_WSS_REAL_AUTH_ENABLED?: string;
}

function readEnv(): AuthEnv {
  return (import.meta as { env?: AuthEnv }).env ?? {};
}

/** True only when the operator/admin explicitly opted into real auth for this build. */
export function isRealAuthEnabled(): boolean {
  return readEnv().VITE_WSS_REAL_AUTH_ENABLED === "true";
}

/** Reports flag + config state so the UI can render a precise disabled message. */
export function getAuthConfigStatus(): { enabled: boolean; configured: boolean; missing: string[] } {
  const env = readEnv();
  const enabled = env.VITE_WSS_REAL_AUTH_ENABLED === "true";
  const missing: string[] = [];
  if (!env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL.trim().length === 0) {
    missing.push("VITE_SUPABASE_URL");
  }
  if (!env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY.trim().length === 0) {
    missing.push("VITE_SUPABASE_ANON_KEY");
  }
  return { enabled, configured: missing.length === 0, missing };
}

let cachedClient: SupabaseClient | null = null;

/**
 * Lazily construct the real auth client. Returns null (no client, no network)
 * unless the flag is on AND both env vars are present. Safe to call anywhere.
 */
export function getAuthClient(): SupabaseClient | null {
  if (!isRealAuthEnabled()) {
    return null;
  }
  const env = readEnv();
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return cachedClient;
}
