/**
 * Phase A — Routing foundation (feature-flagged auth, existing console preserved).
 *
 * Routes:
 *   /               → HomeRoute: existing operator console by default; a safe
 *                     "workspace setup required" placeholder ONLY when real auth
 *                     is enabled and a real user is signed in (no console, no data).
 *   /login          → real login page (or a disabled state when the flag is off).
 *   /auth/callback  → OAuth return handler.
 *   *               → redirect to /.
 *
 * The AuthProvider wraps everything but, with the flag off, produces no session
 * and never calls Supabase — so the operator console behaves exactly as before.
 */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "../components/shell/AppShell";
import { AuthCallback } from "../components/auth/AuthCallback";
import { LoginPage } from "../components/auth/LoginPage";
import { WorkspaceSetupRequired } from "../components/auth/WorkspaceSetupRequired";
import { AuthProvider, useAuth } from "../auth/AuthProvider";

function HomeRoute() {
  const { enabled, session } = useAuth();
  // Real auth ON + signed-in user: Phase A does not resolve or onboard, so never
  // show the operator console to a real session — show the safe placeholder.
  if (enabled && session) {
    return <WorkspaceSetupRequired />;
  }
  // Default / dev path: preserve the existing operator console exactly.
  return <AppShell />;
}

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
