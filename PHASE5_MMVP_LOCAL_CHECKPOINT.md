# WSS Phase 5 — MMVP Local Checkpoint

Status: complete (local only)
Authority: local guarded-dev proof only — not pushed, not deployed, not production-verified.

## 1) Repository State
- Current branch: `phase3-local-foundation`
- Latest commit: `9dbcffa Add Phase 5H ticket closure flow`
- Working tree: clean at checkpoint time

### Phase 5 commit lineage
- `9dbcffa` Add Phase 5H ticket closure flow
- `e173081` Add Phase 5G customer communication flow
- `a55ed4c` Add Phase 5F approval decision flow
- `d99b235` Add Phase 5E request approval flow
- `71faf9d` Add Phase 5D draft reply flow
- `65d9ff8` Add Phase 5C triage flow
- `5581743` Harden Phase 5B create ticket flow
- `a27d3ce` Add Phase 5B create ticket flow
- `2b4e883` Harden Phase 5A read-only data boundaries
- `b06781d` Add Phase 5A live read-only data integration

## 2) Complete Implemented Workflow (local, guarded dev mode)

```
Create Ticket            (received)
   → Triage              (received → triaged)
   → Draft Reply         (triaged → reply_drafted)
   → Request Approval    (reply_drafted → awaiting_gary_approval)
   → Approve / Reject    (awaiting_gary_approval → approved_to_send | → reply_drafted)
   → Send Reply          (approved_to_send → sent_to_customer)   [local-only persistence]
   → Close Ticket        (sent_to_customer → closed)
```

The full lifecycle is exercised end-to-end against the guarded Supabase dev project
(`vrtfbbrwrxyljchywmzy`) by the validation scripts, all of which self-clean.

State machine (authoritative, `src/domain/transitions.ts`):
- received → triaged | blocked
- triaged → reply_drafted | blocked
- reply_drafted → awaiting_gary_approval | blocked
- awaiting_gary_approval → approved_to_send | blocked
- approved_to_send → sent_to_customer
- sent_to_customer → closed
- closed → (terminal)
- blocked → triaged | reply_drafted | awaiting_gary_approval (guarded exit map)

## 3) Phase Summaries

### Phase 5A — Live Read-Only Supabase Data Integration
- Read-only data layer `src/data/readOnlyTicketData.ts` (queue/detail/audit/approval-queue reads).
- Guarded live mode requires `WSS_ALLOW_SUPABASE_VALIDATION=dev`, a non-production env, and the
  expected dev project ref; otherwise the UI falls back to mock data.
- Reads only; anon-style key usage only; service-role key usage blocked. Validator:
  `validate:readonly-data`.

### Phase 5B — Local Create Ticket Flow
- `CreateTicketForm` + `handleCreateTicket` → `createPersistedTicket`.
- Required title/description/client+site/submitter email (with format check).
- Create writes the ticket + `ticket_created` audit only; no draft/approval/communication rows.
- Validator: `validate:create-ticket`.

### Phase 5C — Local Triage Flow
- `received → triaged` via `handleTriageTicket` → `triagePersistedTicket` (CS-agent/internal actor).
- Emits `ticket_triaged` audit; creates no draft/approval/communication rows.
- UI `Triage Ticket` action gated to `received`. Validator: `validate:triage-ticket`.

### Phase 5D — Draft Reply Flow
- `triaged → reply_drafted` via `handleDraftReply` → `draftPersistedReply` (CS-agent only,
  non-empty draft text).
- Persists a `ticket_draft_replies` row + `reply_drafted` audit; no approvals/communications.
- UI `Draft Reply` action gated to `triaged`. Validator: `validate:draft-reply`.

### Phase 5E — Request Approval Flow
- `reply_drafted → awaiting_gary_approval` via `handleRequestApproval` → `requestPersistedApproval`
  → `markReplyReadyForApproval` (CS-agent/internal actor).
- Creates a pending `ticket_approvals` row + `approval_requested` audit; no communication rows;
  no approve/reject decision.
- UI `Request Gary Approval` action gated to `reply_drafted`. Validator: `validate:request-approval`.

### Phase 5F — Gary Approval Decision Flow
- Approve: `awaiting_gary_approval → approved_to_send`; approval row → `approved`;
  `approval_granted` audit; no communication rows; no send.
- Reject: approval row → `rejected`; `approval_rejected` audit; routes back to `reply_drafted`
  (current deterministic state-machine route via transient blocked + auto-unblock).
- Gary/agency-admin approver gate enforced. Persistence fix: `approvePersistedReply` /
  `rejectPersistedReply` upsert the decided approval row (the pending row was already persisted at
  request time) so the decision actually lands. UI `Approve Reply` / `Reject Reply` gated to
  `awaiting_gary_approval`. Validator: `validate:approval-decision`.

### Phase 5G — Customer Communication (persistence-only)
- `approved_to_send → sent_to_customer` via `handleSendApprovedReply` →
  `sendPersistedCustomerReplyLocalOnly` → domain `sendApprovedCustomerReply`.
- Requires an approved approval record, a recipient customer email, and a valid actor context.
- Records a `ticket_communications` row (`delivery_status='pending'`, `external_provider` and
  `external_message_id` NULL) and a `reply_sent` audit. No real email is sent and no provider is
  integrated — communication is persistence-only.
- Read-only helper `getReadOnlySendContext` resolves the approved approval id/reference/time, latest
  draft id, and recipient email so the UI send satisfies the handler's approval-context validation
  without weakening it. UI `Send Reply` gated to `approved_to_send`. Validator: `validate:send-reply`.

### Phase 5H — Ticket Closure Flow
- `sent_to_customer → closed` via `handleCloseTicket` → `closePersistedTicket` → domain `closeTicket`.
- Requires a closure note, an internal actor context, and `sent_to_customer` status.
- Sets status `closed`, stores `closure_note`, sets `closed_at`, emits `ticket_closed` audit.
- Creates no communication row; no email; no reopen; no auto-close after send. `closed` is terminal.
- UI closure-note field + `Close Ticket` action gated to `sent_to_customer` with a non-empty note.
  Validator: `validate:close-ticket`.

## 4) Validation Evidence (this checkpoint)

Standard validations — all PASS:
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run validate:domain`
- `npm run validate:e2e`
- `npm run validate:phase2a`
- `npm run validate:persistence`
- `npm run validate:contracts`
- `npm run validate:handlers`
- `npm run validate:route-boundary`
- `npm run validate:ui-boundary`
- `npm run validate:readonly-data`

Guarded Supabase validations (run sequentially with
`WSS_ALLOW_SUPABASE_VALIDATION=dev WSS_SUPABASE_ENVIRONMENT=dev WSS_SUPABASE_PROJECT_REF=vrtfbbrwrxyljchywmzy`)
— all PASS (exit 0), each self-cleans:
- `npm run validate:draft-reply`
- `npm run validate:request-approval`
- `npm run validate:approval-decision`
- `npm run validate:send-reply`
- `npm run validate:close-ticket`

Each guarded validator proves the success transition plus its negative paths (wrong state,
unauthorized actor, missing required inputs), the required audit event, the absence of disallowed
rows, and that cleanup leaves the database clean.

Note: the guarded Supabase validators contend on the shared dev DB if run concurrently — run them
sequentially (as above).

## 5) Intentionally Not Built (scope boundaries held through Phase 5)
- No authentication / auth provider wiring.
- No API routes (no `app/api`, `pages/api`, or `routes/` files in the boundary).
- No real email sending and no email/communication provider integration
  (Resend/SendGrid/SMTP/Postmark/Mailgun/etc.) — customer communication is persistence-only.
- No customer portal.
- No deployment and no push (local-only; Vercel intentionally not triggered).
- No service-role key in browser/UI source (anon-only, guarded).
- No ticket reopen and no auto-close after send.

## 6) Current Risks / Caveats
- UI mutating actions only function in guarded Supabase-dev mode; default mode is read-only mock.
- Persistence runs through the `supabase db query` CLI under an explicit dev-env guard; guarded
  validators must be run sequentially to avoid shared-dev-DB contention (concurrent runs can report
  transient failures even though the code is correct).
- Reject currently routes to `reply_drafted` (transient blocked + auto-unblock). This is the existing
  deterministic state-machine behavior, not a dedicated reject route; revisit if a distinct
  rejected/needs-rework state is desired.
- `ticket_approvals.requested_at` is bumped to the decision timestamp on approve/reject upsert (the
  upsert update set includes `requested_at`); acceptable locally but worth tightening before prod.
- Communication is local-only: nothing is actually delivered to customers. A real provider plus
  delivery-status reconciliation is required before any production send.
- Read access in guarded mode depends on dev anon key / RLS; read failures fall back to mock.

## 7) Recommended Next Step
- Phase 6 candidate: introduce the secured API route + auth boundary (server-side actor identity and
  tenant scoping) so the workflow handlers can be invoked outside the local guarded validator,
  followed by a real email/communication provider behind the existing local-only send seam
  (`sendPersistedCustomerReplyLocalOnly`). Keep each step gated and independently validated, and only
  consider push/deploy after the auth + route boundary is proven.
