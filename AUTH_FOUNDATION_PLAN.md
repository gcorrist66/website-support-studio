# WSS Authentication Foundation — Planning & Architecture Pass

**Date:** 2026-06-08
**Repository:** website-support-studio
**Status:** Planning only. No code, no migrations, no commits, no pushes.
**Workflow gate:** Diagnosed → Fixed Locally → Committed → Pushed → Deployed → **Production Verified**.
This document covers **Diagnosed** only. Nothing here is "done."

---

## 1. Current auth audit (Phase 1)

### What exists

| Area | File(s) | Reality |
|---|---|---|
| Login screen | `src/components/auth/LoginShell.tsx` | **Simulated.** Header comment: "NOT real authentication… collects no credentials and sends no email… makes no Supabase calls." A `<select>` that cycles modeled states. |
| Session preview | `src/components/auth/SessionSourcePrototype.tsx` | **Dev preview** of session sources. |
| Auth types | `src/auth/authTypes.ts` | **Real & reusable.** `OperatorRole` (agency_admin, cs_agent, gary_approver), `OperatorSession`, `OperatorCapability`. |
| Capability guards | `src/auth/authGuards.ts`, `operatorCapabilities.ts` | **Real & reusable.** Pure functions; header says "No Supabase Auth runtime, no `createClient`, no route files." |
| Auth pipeline | `src/auth/authPipeline.ts` | **Real & reusable.** `Session → Principal → Adapter → OperatorSession → Capability Flags`, pure, "token verification assumed upstream." |
| Session adapter | `src/auth/supabaseAuthSessionAdapter.ts` | **Real & reusable.** Maps a *verified* principal → operator session; links by `auth_user_id` (never email). No runtime client. |
| Identity linking | `src/auth/operatorIdentityLinking.ts`, `operatorSessionResolver.ts` | **Real & reusable.** Resolves a trusted operator row → session; status policy (active/invited/suspended/archived). |
| Local auth mode | `src/auth/localAuthMode.ts` | **Dev/simulated.** Consumes a dev role switcher or an *explicitly supplied synthetic* principal. No login. |
| Dev session | `src/auth/devOperatorSession.ts`, `devSupabaseSessionRead.ts` | **Dev only.** Synthetic operator sessions for local preview. |
| Supabase client | `src/data/readOnlyTicketData.ts` | **Real but NOT auth.** The only `createClient` in the app; anon key, **`persistSession:false, autoRefreshToken:false, detectSessionInUrl:false`**, gated to DEV project ref `vrtfbbrwrxyljchywmzy`, read-only ticket reads. |
| Routing | `src/main.tsx` → `AppShell` | **None.** Single CSR React tree. No router, **no `/auth/callback`**. |
| Env vars | `.env.example` | `VITE_APP_*` (cosmetic); `WSS_SUPABASE_URL/SERVICE_ROLE_KEY/PROJECT_REF/ALLOW_SUPABASE_VALIDATION/ENVIRONMENT`. **No browser auth client env; no `VITE_SUPABASE_ANON_KEY` by default.** |
| Database | `supabase/migrations/*` | `agencies`, `clients`, `sites`, `tickets` (+ detail), and `operators` (Phase 6C). `operators.auth_user_id` is nullable & **unlinked**. **RLS intentionally NOT enabled** (per migration note). |

### Real vs simulated
- **Real (and high-quality):** the entire `src/auth` *mapping/authorization layer* (types, guards, adapter, resolver, pipeline, capability flags) and the `operators` table schema. These assume "a verified session exists" and just resolve authorization from it. This is the hard, careful part — and it's done.
- **Simulated/absent:** every part that produces a *real verified session* — there is **no auth client, no login, no OAuth, no callback, no router, no session persistence, no RLS**. `LoginShell` is a state visualizer.

### Reuse / remove
- **Reuse as-is:** `authTypes`, `authGuards`, `operatorCapabilities`, `authPipeline`, `supabaseAuthSessionAdapter`, `operatorIdentityLinking`, `operatorSessionResolver`, `persistence/operatorTypes`, the `operators` migration. The new real client feeds a verified `session.user` straight into `resolveOperatorSessionFromSession(session, operatorRows)`.
- **Keep for dev only (flag off in prod):** `localAuthMode` (dev_role_switcher), `devOperatorSession`, `devSupabaseSessionRead`, `SessionSourcePrototype`.
- **Remove from the production path:** `LoginShell` simulator (replace with the real sign-in screen). Keep it out of the prod bundle or behind `import.meta.env.DEV`.

### Critical gap discovered — customers ≠ operators
The domain is **Agency → Client → Site → Ticket**, and `operators` are **internal WSS staff** (agency_admin / cs_agent / gary_approver). There is **no customer/end-user identity model**. The marketing "Join Now" funnel produces *customers*, who must not be operators. Real auth therefore needs a **second identity domain** (customer membership) layered on the existing tenant hierarchy. This is the single biggest design implication below.

---

## 2. Recommended auth architecture (Phase 2)

### Provider strategy
- **Launch:** Google OAuth, GitHub OAuth (Supabase-managed, PKCE).
- **Fast follow:** Magic Link, then Email/Password — same `auth.users` backing, same callback, no architecture change.

### Architecture diagram (text)

```
            ┌────────────────────────────┐         ┌─────────────────────────────┐
            │  Marketing (Astro, apex)   │  Login  │  Operator/Customer console  │
            │  websitesupportstudio.com  │ ──────▶ │  app.websitesupportstudio   │
            │  "Join Now" / "Login"      │         │  (Vite SPA + Router)        │
            └────────────────────────────┘         └──────────────┬──────────────┘
                                                                   │ supabase-js (PKCE, persistSession)
                                                                   ▼
   ┌───────────────────────────────────────────────────────────────────────────────┐
   │ Supabase project (app)                                                          │
   │  auth.users  ◀── Google / GitHub providers (redirect to /auth/v1/callback)      │
   │      │                                                                          │
   │      │ auth.uid()                                                               │
   │      ▼                                                                          │
   │  public.operators (staff)        public.org_members (customers) ──▶ clients     │
   │      │  by auth_user_id              │ by auth_user_id              │  sites     │
   │      ▼                               ▼                              ▼  tickets   │
   │  RLS policies (auth.uid scoped) enforce tenant isolation on every table         │
   └───────────────────────────────────────────────────────────────────────────────┘
                                          │  verified session.user
                                          ▼
   Existing PURE pipeline (reused): getSessionPrincipal → resolveOperatorSessionFromAuthPrincipal
                                    → OperatorSession → capability flags → UI guards
```

### Route map (console app)

| Route | Purpose | Access |
|---|---|---|
| `/login` (or `/`) | Sign-in screen: Google + GitHub buttons (Magic Link/password later) | public |
| `/auth/callback` | Receives provider redirect; `exchangeCodeForSession`; routes onward | public (transient) |
| `/onboarding` | First-login customer onboarding form | authenticated, no org yet |
| `/` (workspace) | Operator/customer workspace (existing AppShell) | authenticated + resolved row |
| `/logout` (action) | `supabase.auth.signOut()` → `/login` | authenticated |
| `*` | Not-found → `/login` if unauthenticated | — |

### Session flow
1. SPA boots → `supabase.auth.getSession()` + subscribe `onAuthStateChange`.
2. If session: fetch the caller's `operators` row (by `auth_user_id`) and/or `org_members` row → feed `session` into the existing `resolveOperatorSessionFromSession(...)` (operators) / a parallel customer resolver → capability flags → render workspace.
3. If session but **no operator and no membership** → redirect `/onboarding`.
4. If no session → redirect `/login`.
5. Supabase JS auto-refreshes tokens (`autoRefreshToken:true`, `persistSession:true`).

### Login flow
1. `/login` → click Google/GitHub → `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: <origin>/auth/callback } })`.
2. Redirect to provider → Supabase `/auth/v1/callback` → back to app `/auth/callback?code=…`.

### Callback flow
1. `/auth/callback` mounts → `supabase.auth.exchangeCodeForSession(window.location.href)` (PKCE) **or** rely on `detectSessionInUrl:true`.
2. On success → resolve row → has org/operator? → `/` ; else → `/onboarding`.
3. On error → `/login` with an error toast.

### Logout flow
`supabase.auth.signOut()` → clears local session + `onAuthStateChange('SIGNED_OUT')` → redirect `/login`.

---

## 3. Customer onboarding flow (Phase 3)

**Trigger:** authenticated user with no `operators` row and no `org_members` row.

**Collect (first-login form):** company name, website URL, number of websites, CMS/platform, primary contact (name), support email.

**Generate (single transactional RPC / edge function — server-side, not client writes):**
1. `clients` row = the customer **organization** (under the WSS agency).
2. First `sites` row (the submitted website URL).
3. `org_members` row linking `auth.uid()` → `client_id`, role `customer_admin`, status `active`.
4. `client_onboarding` row (or columns on `clients`) capturing CMS/platform, number_of_websites, primary_contact, support_email.
5. Land the user in the workspace (initial empty ticket queue scoped to their org).

**Idempotency:** keyed on `auth.uid()` — if a membership already exists, skip creation (prevents double-submit duplicate orgs).

---

## 4. Supabase setup checklist (Phase 4)

> Provider OAuth redirect URIs point at **Supabase's** callback (`https://<project-ref>.supabase.co/auth/v1/callback`), **not** the app domain. The app's `/auth/callback` is where Supabase sends the user *after* it processes the provider response.

**Dev project ref (confirmed in code):** `vrtfbbrwrxyljchywmzy`
**Production project ref:** _TBD — confirm before prod wiring._

### Authentication → URL Configuration
- **Site URL:** `https://app.websitesupportstudio.com`
- **Redirect URLs (allow-list):**
  - `https://app.websitesupportstudio.com/auth/callback`
  - `http://localhost:5173/auth/callback`

### Google provider
- Google Cloud Console → OAuth 2.0 Client ID (Web application).
  - **Authorized redirect URI:** `https://<project-ref>.supabase.co/auth/v1/callback`
  - **Authorized JavaScript origins:** `https://app.websitesupportstudio.com`, `http://localhost:5173`
- Supabase → Auth → Providers → **Google**: enable, paste Client ID + Client Secret.

### GitHub provider
- GitHub → Settings → Developer settings → **OAuth Apps** → New.
  - **Homepage URL:** `https://app.websitesupportstudio.com`
  - **Authorization callback URL:** `https://<project-ref>.supabase.co/auth/v1/callback`
- Supabase → Auth → Providers → **GitHub**: enable, paste Client ID + Client Secret.
- Note: GitHub may withhold email (private). Request `user:email` scope and handle email-absent identities.

### Client env (app project, public)
- `VITE_SUPABASE_URL = https://<project-ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY = <anon public key>`
- **Never** ship `WSS_SUPABASE_SERVICE_ROLE_KEY` to the browser.

---

## 5. Database changes (Phase 5)

> Additive migrations on the **app** Supabase project. **RLS must be enabled** — it is currently off everywhere.

1. **`public.org_members`** (new — customer identity):
   - `id uuid pk`, `auth_user_id uuid not null` (→ `auth.users.id`, unique-when-present),
     `client_id uuid not null` (→ `clients.id`), `role` enum (`customer_admin`,`customer_member`),
     `status` enum (`active`,`invited`,`suspended`), timestamps. Unique `(client_id, auth_user_id)`.
2. **`public.client_onboarding`** (new) or columns on `clients`:
   - `client_id`, `cms_platform text`, `number_of_websites int`, `primary_contact text`,
     `support_email text`, `submitted_by uuid`, `created_at`.
3. **`public.operators`** — already has `auth_user_id`; add the **first-login linking** path (link an invited operator's row to `auth.uid()` on first sign-in via a server-side RPC).
4. **RLS — the critical change.** Enable RLS and add policies on `operators`, `clients`, `sites`, `tickets`, `org_members`, `client_onboarding`:
   - Operators: row visible where `auth.uid()` maps to an active operator with matching agency/scope.
   - Customers: rows visible where `auth.uid()` ∈ `org_members` for that `client_id`.
5. **Onboarding RPC** (`security definer`): creates client + site + membership + onboarding atomically; idempotent on `auth.uid()`.
6. (Optional) `handle_new_user` trigger to stamp metadata — prefer the explicit onboarding RPC over implicit triggers for auditability.

### Route changes
Add `react-router-dom`; introduce `/login`, `/auth/callback`, `/onboarding`, workspace `/`, logout action. `main.tsx` wraps `<AppShell>` in `<BrowserRouter>` + an `<AuthProvider>` (session context). Vercel already rewrites all paths → `index.html`, so deep links to `/auth/callback` resolve client-side.

### UI changes
- New real **sign-in screen** (Google + GitHub buttons) using existing brand system; retire `LoginShell` from prod.
- New **onboarding form**.
- `AppShell` gated by real session + resolved row (reuse existing capability flags).
- Auth states: loading, signed-out, onboarding-required, error.

### Risks (Phase 5)
- **RLS is OFF today (highest risk):** without policies, any authenticated user could read all tenants' data. RLS must land *before* real customers.
- **Customer/operator conflation:** keep two identity domains; never auto-promote a customer to operator.
- **Provider redirect misconfig:** the #1 OAuth failure — provider URI must be the Supabase domain, not the app domain.
- **Service-role key leakage:** must stay server-side; client uses anon key only.
- **GitHub private email** and **OAuth email ≠ operator email** — link strictly by `auth_user_id` (already enforced by the adapter).
- **Prod vs dev project:** only the dev ref is known; prod project + keys + redirect URLs must be set separately.
- **Onboarding race / duplicate orgs:** enforce idempotency on `auth.uid()`.
- **SPA callback on static host:** confirmed OK via existing Vercel rewrite, but PKCE requires `detectSessionInUrl`/`exchangeCodeForSession` handled before the router renders protected routes.

### Implementation phases (each carried to **Production Verified**)
- **A — Foundation:** add `react-router-dom`, real browser Supabase auth client (`persistSession:true`, `autoRefreshToken:true`, `detectSessionInUrl:true`), app env vars, `<AuthProvider>`. *(~1–2 eng-days)*
- **B — Login + callback:** `/login` (Google/GitHub), `/auth/callback`, signOut. *(~1–2 days)*
- **C — Wire the existing pipeline:** fetch `operators`/`org_members` by `auth.uid()`, feed verified session into `resolveOperatorSessionFromSession`, route guards. *(~1 day)*
- **D — Customer model + onboarding:** `org_members`/`client_onboarding` migrations, onboarding RPC + form. *(~2–3 days)*
- **E — RLS (gating):** enable + policy-test every table for both identity domains. *(~2 days)*
- **F — Hardening:** error states, session refresh, logout, dev-mode flag, remove simulator from prod bundle. *(~1–2 days)*
- **G — Production Verified:** real Google + GitHub login on `app.websitesupportstudio.com`, onboarding creates org, RLS confirmed by cross-tenant probing.

**Rough total:** ~8–12 engineering-days for a solid, RLS-protected foundation (excludes Magic Link/password fast-follow). Estimates are sizing guidance, not a schedule.

---

## 6. Route map
See §2 (console route table) and §5 (route changes).

## 7. Production risks
See §5 risks. **Top three:** (1) RLS currently disabled, (2) customer/operator identity separation, (3) OAuth provider redirect-URI configuration.

## 8. Why this is *not yet* done
Per Gary's workflow, only **Diagnosed** is complete. Fixed-Locally, Committed, Pushed, Deployed, and Production-Verified all remain. Nothing ships until a real Google/GitHub login works on `app.websitesupportstudio.com` with RLS enforced.
