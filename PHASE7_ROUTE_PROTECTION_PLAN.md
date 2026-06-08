# WSS Phase 7B — Route Protection Plan (Planning Only)

Status: planning only. No route middleware, no API routes, no auth runtime are built here.
Authority: local doc. No push, no deploy.

## 1) Current Architecture
- The app is a **Vite single-page application (SPA)** served as static assets by Vercel.
- There is **no router/route middleware**, **no server routes**, and **no public API routes**.
- Production currently runs in **read-only mock mode** (the bundle carries no Supabase credentials), so
  there is no privileged surface to protect yet — but that changes the moment real data + auth land.
- All workflow handlers are **local pure functions** (`src/handlers`, `src/services`) invoked only in
  guarded dev mode; they are not exposed as endpoints.

## 2) Why Protect Before Real Production Data
- The internal operator workspace shows tickets, drafts, approvals, and audit data. Before any **real
  customer data** is read or written in production, the workspace must be **protected** so only an
  authenticated, active operator can see or act on it.
- Today the dev/preview operator switcher drives capability gating; that is a developer convenience, not
  protection. Real protection must come from a **verified session resolving to an active operator**.

## 3) Route Protection Strategy (staged)
- **Stage 1 — client-side app guard (first):** a top-level guard in the SPA that resolves the current
  session through the existing pipeline (`resolveOperatorSessionFromSession`). If there is no active
  operator session, render only the sign-in surface / a safe "access unavailable" state — never the
  workspace, queue, or actions. This is the first, lowest-risk protection layer and is sufficient for a
  dev-gated internal tool, but it is **not a security boundary on its own** (a static SPA bundle is
  public; the real boundary is the data layer + RLS).
- **Stage 2 — server route guard (later):** when mutations move behind authenticated server routes
  (per `PHASE3_ROUTE_SECURITY_PLAN.md`), each route verifies the Supabase session **server-side**,
  resolves the operator session via the pipeline, and enforces **role + tenant** before calling the
  handler. This is the authoritative boundary for writes.
- **Stage 3 — data-layer enforcement (later):** RLS on tenant tables keyed off the operator row for
  `auth.uid()` (see `PHASE7_RLS_PLAN.md`) — defense in depth so even a forged client cannot read/write
  outside scope.
- **Framework migration consideration:** a Vite SPA has no native server middleware. If/when
  server-side route guards are required, options are (a) add a small server (e.g., Vercel serverless
  functions / an API layer) behind explicit allow-listing, or (b) migrate to a framework with
  first-class server routes + middleware (e.g., Next.js). This is a **later decision**, gated and
  reviewed; not done now. The client-side guard + RLS can carry the first internal rollout without a
  migration.

## 4) Unauthenticated Behavior
- No session, expired session, or no linked active operator → show only the sign-in surface or a safe
  "access unavailable" message. **No ticket queue, no ticket detail, no actions, no audit/approval data**
  are rendered. No data fetches occur for unauthenticated users.

## 5) Authorized Behavior
- A verified session resolving to an **active operator** renders the workspace, with all actions gated
  by **capability flags AND ticket state** (the existing model, now driven by the real session).
- Tenant scope is enforced: an operator only sees/acts within their `agency_id` (and optional
  client/site scope) via `operatorCanAccessTenant` and, later, RLS.

## 6) Role-Based View Restrictions
- **agency_admin** — full operator workspace within the agency, incl. approve/reject and an operator
  admin surface (later).
- **cs_agent** — create/triage/draft/request/send/close + search; no approve/reject; no operator admin.
- **gary_approver** — approve/reject + close + search; no create/triage/draft/request/send; no admin.
- Views and actions are shown/enabled strictly by `operatorCapabilities` (`canSee*`); hidden controls
  must also be enforced at the action/data layer, never by UI hiding alone.

## 7) Why No Public API Routes Yet
- A public unauthenticated mutation surface is the highest-risk thing we could add. Per
  `PHASE3_ROUTE_SECURITY_PLAN.md`, any future route must pass tenant guard, actor guard, approval guard,
  and audit preconditions, and must require a verified session. Until auth is proven end-to-end and RLS
  is in place, **no routes are introduced** — the workflow stays local/guarded.

## 8) Production Verification Requirements (before protection ships)
- Verified-session → active-operator resolution proven in dev (done via the pipeline DB validations).
- Client-side app guard hides the workspace for unauthenticated / no-operator / inactive states.
- No service-role key in the browser bundle; anon key only.
- Server route guard + RLS in place before any **write** path is exposed in production.
- Full safety checklist (`PHASE7_PRODUCTION_AUTH_SAFETY_CHECKLIST.md`) passes; explicit signoff.
