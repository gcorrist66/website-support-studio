# WSS Phase 3D Route Boundary and Security Plan

## 1) Objective and Non-goals

Phase 3D defines the security model for exposing the local handler layer as network routes in a future phase. No public routes are created in this phase.

## 2) Allowed Future Route Surface

Planned internal route surface (future implementation, not yet created):

- `POST /tickets` → create ticket
- `POST /tickets/{ticketId}/triage`
- `POST /tickets/{ticketId}/draft-reply`
- `POST /tickets/{ticketId}/approval/request`
- `POST /tickets/{ticketId}/approval/approve`
- `POST /tickets/{ticketId}/approval/reject`
- `POST /tickets/{ticketId}/reply/send`
- `POST /tickets/{ticketId}/close`
- `POST /tickets/{ticketId}/block`
- `POST /tickets/{ticketId}/unblock`

All are future API candidates only and must remain local-contract/handler calls until route boundary controls are defined.

## 3) Forbidden Route Behavior

- No unauthenticated public mutation routes.
- No `GET /send` / background auto-send endpoint.
- No endpoint that infers “approve-and-send” in a single step.
- No route path that allows changing tenant scope without explicit tenant context.
- No route exposing raw internal identifiers without scoped tenant audit.

## 4) Tenant Context Requirements

Every future route request must require:
- `tenantContext.agencyId`
- `tenantContext.clientId`
- `tenantContext.siteId`

Requests must be denied if any tenant field is missing, blank, or not matching the caller’s scope.

- Handlers must call the existing tenant validation contracts before invoking service functions.
- Persistence queries must continue to filter by tenant hierarchy.

## 5) Actor Context Requirements

Every future route request must require:
- `actorContext.actorRole`
- `actorContext.actorReference`

Allowed roles are bounded by existing handler/service guard rules:
- `cs_agent`
- `agency_admin`
- `gary_approver`
- `system`

Approver actions must remain role-gated and never default to permissive behavior.

## 6) Auth Boundary (Deferred)

- Authentication/authorization is explicitly deferred to a later phase.
- No auth implementation in this phase.
- Future router layer must treat every request as requiring explicit identity and authorization checks before calling handlers.
- No token or auth headers are trusted by the handler layer itself in this phase.

## 7) CS Agent vs Gary Approval Boundary

- CS Agent actions:
  - create, triage, draft, request approval, send request (when authorized), block/unblock when context allows.
- Gary/approver role:
  - approve/reject decision paths only.
- In all phases, handler/service logic continues to enforce:
  - approval is a precondition for customer send,
  - no send without approved approval context.

## 8) No-Autonomous-Send Rule

- No path from ticket state + input should cause implicit customer communication.
- Customer send remains an explicit action and must preserve:
  - recipient
  - approved approval record
  - local-only communication behavior during this phase.

## 9) No-Public-Ticket-Mutation Rule

- This phase does not create any runtime endpoints.
- Any future public endpoint must be explicit allow-list and must pass:
  - tenant guard,
  - actor guard,
  - approval guard,
  - audit preconditions.

## 10) Rate Limit Considerations

- Future route boundary must include route-level request throttling / abuse protections for:
  - create,
  - triage,
  - draft,
  - send,
  - approval,
  - close.

Recommended baseline:
- limit write-path operations per actor/session,
- burst caps,
- lockout window for repeated invalid approval checks.

## 11) Audit Requirements

Future route wrappers must record request-level correlation metadata and pass through handler-level events:
- request id,
- actor identity,
- tenant ids,
- route/action attempted,
- deny reasons.

No route transition may complete without a corresponding workflow audit event stream already defined in `src/domain/ticketLifecycle.ts` and persisted by service/persistence layers.

## 12) Future Customer Portal Boundary

Customer portal work remains out of scope for 3D.

- No endpoints that return internal draft or raw approval metadata.
- No endpoint that allows portal-driven state changes without explicit tenant/actor boundaries.

## 13) Future Search/Card-Search API Considerations

For eventual search APIs, add tenant-aware constraints:
- default to tenant-scoped search by agency/client/site,
- include safe filters by status/priority/client/site,
- avoid fuzzy search across tenant boundaries.

Search routes must only query tenant-constrained indexes and return redacted internals.

## 14) Production Verification Before Public Route Exposure

Before any public route implementation is enabled:

1. Route boundary validator passes:
   - no public route files yet,
   - no auth bypass helpers,
   - no provider send paths,
   - no raw mutation endpoints.
2. All 3Cx validation scripts pass in local mode.
3. `validate:route-boundary` shows route-free codebase state.
4. Explicit security signoff of:
   - tenant enforcement,
   - actor role checks,
   - approval guard,
   - no-autonomous-send,
   - audit-required transitions.

## 15) Checklist of Security Controls

- [ ] Future routes are allow-listed and explicit.
- [ ] Tenant context is required and validated.
- [ ] Actor context is required and role-restricted.
- [ ] No route supports autonomous send.
- [ ] Approval-boundary is enforced in both route and handler service path.
- [ ] No public ticket mutations before authentication is implemented.
- [ ] No third-party communication provider integration in route surface.
- [ ] Route-layer request/response are auditable and correlated.
- [ ] Production verification gating blocks public deployment until full route controls are proven.
