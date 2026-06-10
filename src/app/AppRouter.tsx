/**
 * Routing foundation (feature-flagged auth, existing console preserved).
 *
 * Routes:
 *   /               → HomeRoute: existing operator console by default; for a real
 *                     authenticated session, CustomerGate (Stage B) claims the paid
 *                     org and routes to onboarding / all-set / setup-required.
 *   /login          → Google-only login (or a disabled state when the flag is off).
 *   /auth/callback  → OAuth return handler.
 *   /onboarding     → customer onboarding completion (Stage B).
 *   *               → redirect to /.
 *
 * With the flag off, AuthProvider produces no session and never calls Supabase — the
 * operator console behaves exactly as before.
 */
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "../components/shell/AppShell";
import { AuthCallback } from "../components/auth/AuthCallback";
import { LoginPage } from "../components/auth/LoginPage";
import { IdentityGate } from "../components/auth/IdentityGate";
import { OnboardingForm } from "../components/customer/OnboardingForm";
import { AuthProvider, useAuth } from "../auth/AuthProvider";

function HomeRoute() {
  const { enabled, loading, session } = useAuth();
  // Real auth ON + signed-in user: resolve identity and route — operator → console,
  // customer → onboarding/all-set, unknown → setup. Operators are never routed into
  // customer onboarding; customers never reach operator tooling.
  if (enabled && session) {
    return <IdentityGate />;
  }
  if (enabled) {
    return <LoginPage />;
  }
  // Default / dev path (flag off): preserve the existing operator console exactly.
  return loading ? <LoginPage /> : <AppShell />;
}

function OnboardingRoute() {
  const { enabled, loading, session } = useAuth();
  if (!enabled) {
    return <Navigate to="/" replace />;
  }
  if (!loading && !session) {
    return <Navigate to="/login" replace />;
  }
  return <OnboardingForm />;
}

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/overview" element={<HomeRoute />} />
          <Route path="/board" element={<HomeRoute />} />
          <Route path="/projects" element={<HomeRoute />} />
          <Route path="/requests" element={<HomeRoute />} />
          <Route path="/profile" element={<HomeRoute />} />
          <Route path="/account" element={<Navigate to="/profile" replace />} />
          <Route path="/website_access" element={<HomeRoute />} />
          <Route path="/activity" element={<HomeRoute />} />
          <Route path="/health" element={<HomeRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<OnboardingRoute />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
