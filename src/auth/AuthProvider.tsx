/**
 * Phase A — Auth session provider (feature-flagged).
 *
 * Exposes the real Supabase session/user and the OAuth actions to the app. When
 * the feature flag is off, it renders children immediately with no session, no
 * loading, and never touches Supabase. It does NOT resolve operators/customers,
 * create records, or link identities — that is later-phase work.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getAuthClient, isRealAuthEnabled } from "./realAuthClient";

export type OAuthProvider = "google" | "github";

interface AuthContextValue {
  /** Whether real auth is enabled for this build. */
  enabled: boolean;
  /** True while the initial session is being read. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  error: string | null;
  // eslint-disable-next-line no-unused-vars -- param name in a type signature
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const enabled = isRealAuthEnabled();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const client = getAuthClient();
    if (!client) {
      setError("auth_not_configured");
      setLoading(false);
      return;
    }

    let active = true;

    client.auth
      .getSession()
      .then(({ data }) => {
        if (!active) {
          return;
        }
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setError("session_load_failed");
        setLoading(false);
      });

    const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [enabled]);

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled,
      loading,
      session,
      user: session?.user ?? null,
      error,
      signInWithOAuth: async (provider: OAuthProvider) => {
        const client = getAuthClient();
        if (!client) {
          setError("auth_not_configured");
          return;
        }
        setError(null);
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { error: oauthError } = await client.auth.signInWithOAuth({
          provider,
          options: { redirectTo },
        });
        if (oauthError) {
          setError(oauthError.message);
        }
      },
      signOut: async () => {
        const client = getAuthClient();
        if (!client) {
          return;
        }
        await client.auth.signOut();
        setSession(null);
      },
    }),
    [enabled, loading, session, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
