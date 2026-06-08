/**
 * Phase 6V — Local Supabase auth client wrapper (read-only mapping; NOT login).
 *
 * Maps an ALREADY-VERIFIED Supabase session/user shape to a `SupabaseAuthPrincipal` so the auth
 * pipeline can resolve an operator session. This is a pure, read-only adapter layer:
 *
 *   Supabase session source  →  SupabaseAuthPrincipal
 *
 * It performs NO sign-in, NO sign-up, NO sign-out, NO password reset, NO magic link / OTP calls, and
 * NEVER creates auth users. It makes NO network calls, imports NO Supabase client runtime, writes
 * nothing, and handles no browser secrets. It accepts plain session/user shapes (whatever a verified
 * session looks like) and returns a principal — token verification must happen upstream.
 */

import type { SupabaseAuthPrincipal } from "./supabaseAuthSessionAdapter";

/** Minimal shape of a Supabase auth user (the relevant fields of `auth.users` / session.user). */
export interface SupabaseUserLike {
  id?: string;
  email?: string | null;
  aud?: string | null;
  role?: string | null;
}

/** Minimal shape of a Supabase session (only the fields this wrapper reads). */
export interface SupabaseSessionLike {
  /** Unix epoch SECONDS at which the session expires (Supabase convention), if known. */
  expires_at?: number;
  token_type?: string;
  user?: SupabaseUserLike | null;
}

function trimmedOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

/** Convert a Supabase `expires_at` (unix seconds) to an ISO-8601 string, if valid. */
function expiresAtToIso(expiresAtSeconds: number | undefined): string | undefined {
  if (typeof expiresAtSeconds !== "number" || !Number.isFinite(expiresAtSeconds) || expiresAtSeconds <= 0) {
    return undefined;
  }
  return new Date(expiresAtSeconds * 1000).toISOString();
}

/**
 * Build a principal from a verified user shape. Returns null when there is no usable user object.
 * The id is carried through as-is (the adapter validates it); email/aud/role are advisory only.
 */
export function extractPrincipalFromUser(
  user: SupabaseUserLike | null | undefined,
  expiresAtIso?: string,
): SupabaseAuthPrincipal | null {
  if (!user || typeof user !== "object") {
    return null;
  }
  const id = typeof user.id === "string" ? user.id.trim() : "";
  if (id.length === 0) {
    return null;
  }
  const principal: SupabaseAuthPrincipal = { id };
  const email = trimmedOrUndefined(user.email);
  if (email) {
    principal.email = email;
  }
  const aud = trimmedOrUndefined(user.aud);
  if (aud) {
    principal.aud = aud;
  }
  const role = trimmedOrUndefined(user.role);
  if (role) {
    principal.role = role;
  }
  if (expiresAtIso) {
    principal.expiresAt = expiresAtIso;
  }
  return principal;
}

/** Build a principal from a verified session shape (carries the session expiry). Null when no user. */
export function extractPrincipalFromSession(session: SupabaseSessionLike | null | undefined): SupabaseAuthPrincipal | null {
  if (!session || typeof session !== "object") {
    return null;
  }
  return extractPrincipalFromUser(session.user ?? null, expiresAtToIso(session.expires_at));
}

/**
 * The public read-only entry point: given a verified session (or null), return its principal or null.
 * Does not verify the session — the caller is responsible for supplying an already-verified session.
 */
export function getSessionPrincipal(session: SupabaseSessionLike | null | undefined): SupabaseAuthPrincipal | null {
  return extractPrincipalFromSession(session);
}

/** DEV-only synthetic user fixture (NOT a real auth user). For local pipeline previews/tests. */
export function createSyntheticUser(input: { id: string; email?: string; aud?: string; role?: string }): SupabaseUserLike {
  return {
    id: input.id,
    email: input.email ?? null,
    aud: input.aud ?? "authenticated",
    role: input.role ?? "authenticated",
  };
}

/** DEV-only synthetic session fixture (NOT a real auth session). For local pipeline previews/tests. */
export function createSyntheticSession(input: {
  id: string;
  email?: string;
  expiresAtIso?: string;
}): SupabaseSessionLike {
  const expiresAtIso = input.expiresAtIso;
  const expires_at = expiresAtIso ? Math.floor(Date.parse(expiresAtIso) / 1000) : undefined;
  return {
    expires_at: Number.isFinite(expires_at) ? expires_at : undefined,
    token_type: "synthetic-no-token",
    user: createSyntheticUser({ id: input.id, email: input.email }),
  };
}
