import { useEffect, useMemo, useState } from "react";

import { ReadOnlyTicketDetail } from "../tickets/ReadOnlyTicketDetail";
import { ReadOnlyTicketQueue } from "../tickets/ReadOnlyTicketQueue";
import { CreateTicketForm } from "../tickets/CreateTicketForm";
import { ActorRole } from "../../domain/ticketStatus";
import {
  handleApproveReply,
  handleCloseTicket,
  handleDraftReply,
  handleRejectReply,
  handleRequestApproval,
  handleSendApprovedReply,
  handleTriageTicket,
} from "../../handlers/ticketWorkflowHandlers";
import {
  getReadOnlyApprovalQueue,
  getReadOnlyModeLabel,
  getReadOnlySendContext,
  getReadOnlyTicketAuditTimeline,
  getReadOnlyTicketDetail,
  getReadOnlyTicketQueue,
  getReadOnlyDataMode,
} from "../../data/readOnlyTicketData";
import { auditTrail, getTicketDetail, ticketQueue, type MockApprovalItem, type MockAuditEvent, type MockTicketQueueItem } from "../../ui/mockData";
import { filterTickets, getSearchFilterSummary, type TicketSearchFilters } from "../../search/ticketSearch";
import {
  DEV_ADAPTER_PRINCIPAL_PRESETS,
  DEV_OPERATOR_ROLE_OPTIONS,
  DEV_PREVIEW_OPERATOR_ROWS,
  type DevOperatorRoleChoice,
} from "../../auth/devOperatorSession";
import {
  createAdapterPrincipalAuthState,
  createDevRoleSwitcherAuthState,
  getActiveCapabilityFlags,
  getActiveOperatorSession,
  type AuthMode,
} from "../../auth/localAuthMode";

export function AppShell() {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [blockedFilter, setBlockedFilter] = useState("all");
  const [identityFilter, setIdentityFilter] = useState("all");
  const [devOperatorRole, setDevOperatorRole] = useState<DevOperatorRoleChoice>("agency_admin");
  const [authMode, setAuthMode] = useState<AuthMode>("dev_role_switcher");
  const [adapterPrincipalId, setAdapterPrincipalId] = useState("");
  const [selectedTicketId, setSelectedTicketId] = useState("TKT-LOCAL-1001");
  const [selectedTicket, setSelectedTicket] = useState(() => getTicketDetail("TKT-LOCAL-1001"));
  const [auditTimeline, setAuditTimeline] = useState<MockAuditEvent[]>([]);
  const [ticketQueueData, setTicketQueueData] = useState<MockTicketQueueItem[]>(ticketQueue);
  const [approvalQueue, setApprovalQueue] = useState<MockApprovalItem[]>([]);
  const [readOnlyMode, setReadOnlyMode] = useState<ReturnType<typeof getReadOnlyDataMode>>("mock");
  const [triageMessage, setTriageMessage] = useState("");
  const [triageError, setTriageError] = useState("");
  const [triageInProgress, setTriageInProgress] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [draftError, setDraftError] = useState("");
  const [draftInProgress, setDraftInProgress] = useState(false);
  const [approvalRequestMessage, setApprovalRequestMessage] = useState("");
  const [approvalRequestError, setApprovalRequestError] = useState("");
  const [approvalRequestInProgress, setApprovalRequestInProgress] = useState(false);
  const [approvalDecisionMessage, setApprovalDecisionMessage] = useState("");
  const [approvalDecisionError, setApprovalDecisionError] = useState("");
  const [approvalDecisionInProgress, setApprovalDecisionInProgress] = useState(false);
  const [sendReplyMessage, setSendReplyMessage] = useState("");
  const [sendReplyError, setSendReplyError] = useState("");
  const [sendReplyInProgress, setSendReplyInProgress] = useState(false);
  const [closureNote, setClosureNote] = useState("");
  const [closeTicketMessage, setCloseTicketMessage] = useState("");
  const [closeTicketError, setCloseTicketError] = useState("");
  const [closeTicketInProgress, setCloseTicketInProgress] = useState(false);

  const loadReadOnlyData = async (modeOverride?: string) => {
    const mode = modeOverride === "mock" || modeOverride === "supabase-dev-readonly" ? modeOverride : getReadOnlyDataMode();
    setReadOnlyMode(mode);

    const [queue, approvals] = await Promise.all([
      getReadOnlyTicketQueue(),
      getReadOnlyApprovalQueue(),
    ]);

    setTicketQueueData(queue);
    setApprovalQueue(approvals);

    const activeId = queue.find((ticket) => ticket.id === selectedTicketId)?.id ?? queue[0]?.id ?? selectedTicketId;
    setSelectedTicketId(activeId);
  };

  useEffect(() => {
    loadReadOnlyData().catch(() => {
      setTicketQueueData(ticketQueue);
      setApprovalQueue([]);
      setReadOnlyMode("mock");
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateDetail = async () => {
      const [detail, timeline] = await Promise.all([
        getReadOnlyTicketDetail(selectedTicketId),
        getReadOnlyTicketAuditTimeline(selectedTicketId),
      ]);

      if (!cancelled) {
        setSelectedTicket(detail);
        setAuditTimeline(timeline);
      }
    };

    hydrateDetail().catch(() => {
      if (!cancelled) {
        setSelectedTicket(getTicketDetail(selectedTicketId));
        setAuditTimeline(auditTrail);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedTicketId]);

  const clients = useMemo(() => {
    return Array.from(new Set(ticketQueueData.map((ticket) => ticket.clientName)));
  }, [ticketQueueData]);

  const sites = useMemo(() => {
    return Array.from(new Set(ticketQueueData.map((ticket) => ticket.siteName)));
  }, [ticketQueueData]);

  const searchFilters: TicketSearchFilters = useMemo(
    () => ({
      searchText,
      status: statusFilter,
      priority: priorityFilter,
      clientName: clientFilter,
      siteName: siteFilter,
      blocked: blockedFilter,
      identityConfidence: identityFilter,
    }),
    [searchText, statusFilter, priorityFilter, clientFilter, siteFilter, blockedFilter, identityFilter],
  );

  const filteredTickets: MockTicketQueueItem[] = useMemo(
    () => filterTickets(ticketQueueData, searchFilters),
    [ticketQueueData, searchFilters],
  );

  const searchSummary = useMemo(
    () => getSearchFilterSummary(searchFilters, filteredTickets.length),
    [searchFilters, filteredTickets.length],
  );

  useEffect(() => {
    if (filteredTickets.length > 0 && !filteredTickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(filteredTickets[0].id);
    }
  }, [filteredTickets, selectedTicketId]);

  const handleTriageTicketAction = async () => {
    if (readOnlyMode !== "supabase-dev-readonly") {
      setTriageError("Triage is only available in guarded Supabase-dev data mode.");
      return;
    }

    if (!selectedTicket?.workflowId) {
      setTriageError("No workflow identifier available for this ticket.");
      return;
    }

    setTriageError("");
    setTriageMessage("");
    setTriageInProgress(true);

    const result = handleTriageTicket({
      tenantContext: {
        agencyId: selectedTicket.tenantContext.agencyId,
        clientId: selectedTicket.tenantContext.clientId,
        siteId: selectedTicket.tenantContext.siteId,
      },
      actorContext: {
        actorRole: ActorRole.CS_AGENT,
        actorReference: "phase5c-ui-operator",
      },
      ticketId: selectedTicket.workflowId,
      rationale: "Manual CS triage from phase-5C UI",
    });

    if (result.status === "error") {
      setTriageError(result.error);
      setTriageMessage("");
      setTriageInProgress(false);
      return;
    }

    const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
    const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.id);
    setSelectedTicket(refreshed);
    setAuditTimeline(timeline);
    setTriageMessage(`Ticket ${selectedTicket.id} triaged successfully.`);
    setTriageInProgress(false);
  };

  const handleDraftReplyAction = async () => {
    if (readOnlyMode !== "supabase-dev-readonly") {
      setDraftError("Draft reply is only available in guarded Supabase-dev data mode.");
      return;
    }

    if (!selectedTicket?.workflowId) {
      setDraftError("No workflow identifier available for this ticket.");
      return;
    }

    const normalizedDraftText = draftText.trim();
    if (!normalizedDraftText) {
      setDraftError("Draft body is required.");
      return;
    }

    setDraftError("");
    setDraftMessage("");
    setDraftInProgress(true);

    const result = handleDraftReply({
      tenantContext: {
        agencyId: selectedTicket.tenantContext.agencyId,
        clientId: selectedTicket.tenantContext.clientId,
        siteId: selectedTicket.tenantContext.siteId,
      },
      actorContext: {
        actorRole: ActorRole.CS_AGENT,
        actorReference: "phase5d-ui-operator",
      },
      ticketId: selectedTicket.workflowId,
      draftText: normalizedDraftText,
    });

    if (result.status === "error") {
      setDraftError(result.error);
      setDraftMessage("");
      setDraftInProgress(false);
      return;
    }

    const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
    const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.workflowId);
    setSelectedTicket(refreshed);
    setAuditTimeline(timeline);
    setDraftMessage(`Draft created for ticket ${selectedTicket.id}.`);
    setDraftText("");
    setDraftInProgress(false);
  };

  const handleRequestApprovalAction = async () => {
    if (readOnlyMode !== "supabase-dev-readonly") {
      setApprovalRequestError("Request approval is only available in guarded Supabase-dev data mode.");
      return;
    }

    if (!selectedTicket?.workflowId) {
      setApprovalRequestError("No workflow identifier available for this ticket.");
      return;
    }

    setApprovalRequestError("");
    setApprovalRequestMessage("");
    setApprovalRequestInProgress(true);

    const result = handleRequestApproval({
      tenantContext: {
        agencyId: selectedTicket.tenantContext.agencyId,
        clientId: selectedTicket.tenantContext.clientId,
        siteId: selectedTicket.tenantContext.siteId,
      },
      actorContext: {
        actorRole: ActorRole.CS_AGENT,
        actorReference: "phase5e-ui-operator",
      },
      ticketId: selectedTicket.workflowId,
      requestNotes: "Manual CS approval request from phase-5E UI",
    });

    if (result.status === "error") {
      setApprovalRequestError(result.error);
      setApprovalRequestMessage("");
      setApprovalRequestInProgress(false);
      return;
    }

    const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
    const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.workflowId);
    setSelectedTicket(refreshed);
    setAuditTimeline(timeline);
    setApprovalRequestMessage(`Gary approval requested for ticket ${selectedTicket.id}.`);
    setApprovalRequestInProgress(false);
  };

  const runApprovalDecision = async (decision: "approve" | "reject") => {
    if (readOnlyMode !== "supabase-dev-readonly") {
      setApprovalDecisionError("Approval decisions are only available in guarded Supabase-dev data mode.");
      return;
    }

    if (!selectedTicket?.workflowId) {
      setApprovalDecisionError("No workflow identifier available for this ticket.");
      return;
    }

    setApprovalDecisionError("");
    setApprovalDecisionMessage("");
    setApprovalDecisionInProgress(true);

    const tenantContext = {
      agencyId: selectedTicket.tenantContext.agencyId,
      clientId: selectedTicket.tenantContext.clientId,
      siteId: selectedTicket.tenantContext.siteId,
    };
    const actorContext = {
      actorRole: ActorRole.GARY_APPROVER,
      actorReference: "phase5f-ui-approver",
    };
    // The handler resolves the latest pending approval server-side; approvalId is advisory here.
    const approvalId = selectedTicket.workflowId;

    const result =
      decision === "approve"
        ? handleApproveReply({
            tenantContext,
            actorContext,
            ticketId: selectedTicket.workflowId,
            approvalId,
            approvalNotes: "Approved by Gary from phase-5F UI",
          })
        : handleRejectReply({
            tenantContext,
            actorContext,
            ticketId: selectedTicket.workflowId,
            approvalId,
            rejectionNotes: "Returned for rework by Gary from phase-5F UI",
          });

    if (result.status === "error") {
      setApprovalDecisionError(result.error);
      setApprovalDecisionMessage("");
      setApprovalDecisionInProgress(false);
      return;
    }

    const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
    const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.workflowId);
    setSelectedTicket(refreshed);
    setAuditTimeline(timeline);
    setApprovalDecisionMessage(
      decision === "approve"
        ? `Reply approved for ticket ${selectedTicket.id}.`
        : `Reply rejected for ticket ${selectedTicket.id}.`,
    );
    setApprovalDecisionInProgress(false);
  };

  const handleApproveReplyAction = async () => {
    await runApprovalDecision("approve");
  };

  const handleRejectReplyAction = async () => {
    await runApprovalDecision("reject");
  };

  const handleSendReplyAction = async () => {
    if (readOnlyMode !== "supabase-dev-readonly") {
      setSendReplyError("Send reply is only available in guarded Supabase-dev data mode.");
      return;
    }

    if (!selectedTicket?.workflowId) {
      setSendReplyError("No workflow identifier available for this ticket.");
      return;
    }

    setSendReplyError("");
    setSendReplyMessage("");
    setSendReplyInProgress(true);

    // The send handler validates the approval id, draft id, and recipient email against
    // persisted state, so resolve them read-only before issuing the local-only send.
    const sendContext = await getReadOnlySendContext(selectedTicket.workflowId);
    if (!sendContext) {
      setSendReplyError("Could not resolve approved approval, draft, or recipient context for this ticket.");
      setSendReplyInProgress(false);
      return;
    }

    const result = handleSendApprovedReply({
      tenantContext: {
        agencyId: selectedTicket.tenantContext.agencyId,
        clientId: selectedTicket.tenantContext.clientId,
        siteId: selectedTicket.tenantContext.siteId,
      },
      actorContext: {
        actorRole: ActorRole.CS_AGENT,
        actorReference: "phase5g-ui-operator",
      },
      ticketId: selectedTicket.workflowId,
      draftReplyId: sendContext.draftReplyId,
      recipientEmail: sendContext.recipientEmail,
      approvalContext: {
        approvalId: sendContext.approvalId,
        approvedByActorReference: sendContext.approvedByActorReference,
        approvedAt: sendContext.approvedAt,
      },
      rationale: "Customer reply recorded as sent (local-only) from phase-5G UI",
      communicationContext: { channel: "local_only" },
    });

    if (result.status === "error") {
      setSendReplyError(result.error);
      setSendReplyMessage("");
      setSendReplyInProgress(false);
      return;
    }

    const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
    const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.workflowId);
    setSelectedTicket(refreshed);
    setAuditTimeline(timeline);
    setSendReplyMessage(`Reply recorded as sent (local-only) for ticket ${selectedTicket.id}.`);
    setSendReplyInProgress(false);
  };

  const handleCloseTicketAction = async () => {
    if (readOnlyMode !== "supabase-dev-readonly") {
      setCloseTicketError("Close ticket is only available in guarded Supabase-dev data mode.");
      return;
    }

    if (!selectedTicket?.workflowId) {
      setCloseTicketError("No workflow identifier available for this ticket.");
      return;
    }

    const normalizedClosureNote = closureNote.trim();
    if (!normalizedClosureNote) {
      setCloseTicketError("Closure note is required.");
      return;
    }

    setCloseTicketError("");
    setCloseTicketMessage("");
    setCloseTicketInProgress(true);

    const result = handleCloseTicket({
      tenantContext: {
        agencyId: selectedTicket.tenantContext.agencyId,
        clientId: selectedTicket.tenantContext.clientId,
        siteId: selectedTicket.tenantContext.siteId,
      },
      actorContext: {
        actorRole: ActorRole.CS_AGENT,
        actorReference: "phase5h-ui-operator",
      },
      ticketId: selectedTicket.workflowId,
      closureNote: normalizedClosureNote,
    });

    if (result.status === "error") {
      setCloseTicketError(result.error);
      setCloseTicketMessage("");
      setCloseTicketInProgress(false);
      return;
    }

    const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
    const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.workflowId);
    setSelectedTicket(refreshed);
    setAuditTimeline(timeline);
    setCloseTicketMessage(`Ticket ${selectedTicket.id} closed.`);
    setClosureNote("");
    setCloseTicketInProgress(false);
  };

  // Phase 6R: the local auth mode (dev role switcher OR adapter-principal preview) provides the
  // operator session that drives UI capability gating. This is a LOCAL preview only — NOT a sign-in.
  const localAuthState = useMemo(() => {
    if (authMode === "adapter_principal") {
      const trimmedId = adapterPrincipalId.trim();
      const principal = trimmedId ? { id: trimmedId } : null;
      return createAdapterPrincipalAuthState(principal, DEV_PREVIEW_OPERATOR_ROWS);
    }
    return createDevRoleSwitcherAuthState(devOperatorRole);
  }, [authMode, devOperatorRole, adapterPrincipalId]);

  const operatorSession = getActiveOperatorSession(localAuthState);
  const capabilities = getActiveCapabilityFlags(localAuthState);

  // An action is offered only when BOTH the ticket-state is eligible (guarded dev mode) AND the
  // current operator role has the capability to see/perform it.
  const canTriageSelected =
    readOnlyMode === "supabase-dev-readonly" && selectedTicket.status === "received" && capabilities.canSeeTriage;
  const canDraftReplySelected =
    readOnlyMode === "supabase-dev-readonly" &&
    selectedTicket.status === "triaged" &&
    Boolean(selectedTicket.workflowId) &&
    capabilities.canSeeDraftReply;
  const canRequestApprovalSelected =
    readOnlyMode === "supabase-dev-readonly" &&
    selectedTicket.status === "reply_drafted" &&
    Boolean(selectedTicket.workflowId) &&
    capabilities.canSeeRequestApproval;
  const canDecideApprovalSelected =
    readOnlyMode === "supabase-dev-readonly" &&
    selectedTicket.status === "awaiting_gary_approval" &&
    Boolean(selectedTicket.workflowId) &&
    capabilities.canSeeApproveReply &&
    capabilities.canSeeRejectReply;
  const canSendReplySelected =
    readOnlyMode === "supabase-dev-readonly" &&
    selectedTicket.status === "approved_to_send" &&
    Boolean(selectedTicket.workflowId) &&
    capabilities.canSeeSendReply;
  const canCloseTicketSelected =
    readOnlyMode === "supabase-dev-readonly" &&
    selectedTicket.status === "sent_to_customer" &&
    Boolean(selectedTicket.workflowId) &&
    capabilities.canSeeCloseTicket;

  return (
    <div className="phase4a-shell">
      <header className="phase4a-header">
        <div>
          <p className="brand-kicker">Website Support Studio</p>
          <h1>Internal Operator Workspace</h1>
          <p>Phase 5A Live Read-Only Data Integration</p>
        </div>
            <span className="status-pill">
              {getReadOnlyModeLabel()} · Full local workflow phase (triage → close)
            </span>
          </header>

      <div className="phase4a-layout">
        <nav className="phase4a-nav" aria-label="Primary">
          <h2>Navigation</h2>
          <ul>
            <li>Dashboard</li>
            <li>Tickets</li>
            <li>Approvals</li>
            <li>Audit Trail</li>
            <li>System Status</li>
          </ul>
        </nav>

        <main className="phase4a-main">
          <section className="phase4a-card phase6-operator-card">
            <h2>Operator (Development Mode Only)</h2>
            <p className="placeholder-meta">
              Local capability preview only — this is NOT a sign-in and performs no credential check. It previews
              role-based action visibility from a synthetic in-memory operator session. No production auth behavior.
            </p>

            <fieldset className="phase6-auth-mode">
              <legend>Development Auth Mode</legend>
              <label>
                <input
                  type="radio"
                  name="wss-dev-auth-mode"
                  value="dev_role_switcher"
                  checked={authMode === "dev_role_switcher"}
                  onChange={() => setAuthMode("dev_role_switcher")}
                />
                Dev Role Switcher
              </label>
              <label>
                <input
                  type="radio"
                  name="wss-dev-auth-mode"
                  value="adapter_principal"
                  checked={authMode === "adapter_principal"}
                  onChange={() => setAuthMode("adapter_principal")}
                />
                Adapter Principal Preview
              </label>
            </fieldset>

            {authMode === "dev_role_switcher" ? (
              <label className="phase6-operator-switcher">
                Acting as
                <select
                  value={devOperatorRole}
                  onChange={(event) => setDevOperatorRole(event.target.value as DevOperatorRoleChoice)}
                >
                  {DEV_OPERATOR_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="phase6-adapter-preview">
                <p className="placeholder-meta">
                  Resolves an operator session via the adapter from a supplied synthetic auth principal id
                  (id only — no real auth user, no DB writes). The linkage source of truth is auth_user_id.
                </p>
                <label className="phase6-operator-switcher">
                  Principal preset
                  <select value={adapterPrincipalId} onChange={(event) => setAdapterPrincipalId(event.target.value)}>
                    <option value="">— none —</option>
                    {DEV_ADAPTER_PRINCIPAL_PRESETS.map((preset) => (
                      <option key={preset.principalId} value={preset.principalId}>
                        {preset.label} ({preset.principalId})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="phase6-operator-switcher">
                  Synthetic auth principal id
                  <input
                    type="text"
                    value={adapterPrincipalId}
                    onChange={(event) => setAdapterPrincipalId(event.target.value)}
                    placeholder="synthetic uuid (dev only)"
                  />
                </label>
                <p className="placeholder-meta" role="status">
                  {operatorSession
                    ? `Resolved operator session: ${operatorSession.displayName} · role ${operatorSession.role}`
                    : adapterPrincipalId.trim()
                      ? "No linked operator for this principal in dev."
                      : "Enter or select a synthetic auth principal id to preview the adapter result."}
                </p>
              </div>
            )}

            <p className="placeholder-meta">
              {operatorSession
                ? `Active operator (dev): ${operatorSession.displayName} · role ${operatorSession.role}`
                : "No operator session — operator actions are hidden."}
            </p>
            <ul className="phase6-capability-list">
              <li>Create ticket: {capabilities.canSeeCreateTicket ? "visible" : "hidden"}</li>
              <li>Triage: {capabilities.canSeeTriage ? "visible" : "hidden"}</li>
              <li>Draft reply: {capabilities.canSeeDraftReply ? "visible" : "hidden"}</li>
              <li>Request approval: {capabilities.canSeeRequestApproval ? "visible" : "hidden"}</li>
              <li>Approve / Reject: {capabilities.canSeeApproveReply ? "visible" : "hidden"}</li>
              <li>Send reply: {capabilities.canSeeSendReply ? "visible" : "hidden"}</li>
              <li>Close ticket: {capabilities.canSeeCloseTicket ? "visible" : "hidden"}</li>
              <li>Operator admin: {capabilities.canSeeOperatorAdmin ? "visible" : "hidden"}</li>
            </ul>
          </section>

          <section className="phase4a-card">
            <h2>Workspace status</h2>
            <p>Read-only internal operator workspace. Data mode and available actions are shown below.</p>
            <dl className="phase7-status-list">
              <div>
                <dt>Data mode</dt>
                <dd>
                  {readOnlyMode === "supabase-dev-readonly"
                    ? "Supabase dev read-only mode — live data is read-only and requires the WSS_ALLOW_SUPABASE_VALIDATION=dev guard."
                    : "Mock data mode — local sample data only, until the guarded dev environment is supplied."}
                </dd>
              </div>
              <div>
                <dt>Workflow mode</dt>
                <dd>
                  {readOnlyMode === "supabase-dev-readonly"
                    ? "Local operator workflow mode — triage → draft → request approval → approve/reject → send (local-only) → close, each gated by ticket-state eligibility."
                    : "Workflow actions are inactive in mock mode; they activate only in guarded Supabase dev mode."}
                </dd>
              </div>
              <div>
                <dt>Public exposure</dt>
                <dd>
                  No live public actions are exposed: no authentication, no public API routes, no real email delivery, and no customer portal.
                </dd>
              </div>
              <div>
                <dt>Reply delivery</dt>
                <dd>
                  Persistence-only. A sent reply is recorded locally; no real email is delivered. Approval is required before send.
                </dd>
              </div>
            </dl>
          </section>

          {capabilities.canSeeCreateTicket ? (
            <CreateTicketForm />
          ) : (
            <section className="phase4a-card">
              <h2>Create ticket</h2>
              <p className="placeholder-meta phase7-empty-state" role="status">
                Create ticket is not available for the current operator role.
              </p>
            </section>
          )}

          <section className="phase4a-card phase4d-search-panel">
            <h2>Search and Filters</h2>
            <p className="placeholder-meta">
              {readOnlyMode === "supabase-dev-readonly"
                ? "All results are loaded from read-only guarded Supabase for this phase. Search and filtering are read-only."
                : "Mock-data only mode until guarded dev env is supplied. Search and filtering are read-only."}
            </p>
            <p className="placeholder-meta" role="status" aria-live="polite">{searchSummary}</p>
            <div className="phase4d-filter-grid">
              <label>
                Search
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search by ticket #, title, submitter, client, or site"
                />
              </label>

              <label>
                Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="received">received</option>
                  <option value="triaged">triaged</option>
                  <option value="reply_drafted">reply_drafted</option>
                  <option value="awaiting_gary_approval">awaiting_gary_approval</option>
                  <option value="approved_to_send">approved_to_send</option>
                  <option value="sent_to_customer">sent_to_customer</option>
                  <option value="blocked">blocked</option>
                  <option value="closed">closed</option>
                </select>
              </label>

              <label>
                Priority
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                  <option value="normal">normal</option>
                  <option value="critical">critical</option>
                </select>
              </label>

              <label>
                Client
                <select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}>
                  <option value="all">All</option>
                  {clients.map((client) => (
                    <option key={client} value={client}>
                      {client}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Site
                <select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)}>
                  <option value="all">All</option>
                  {sites.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Blocked
                <select value={blockedFilter} onChange={(event) => setBlockedFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="blocked">Blocked only</option>
                  <option value="not-blocked">Not blocked</option>
                </select>
              </label>

              <label>
                Identity
                <select value={identityFilter} onChange={(event) => setIdentityFilter(event.target.value)}>
                  <option value="all">All</option>
                  <option value="known">known</option>
                  <option value="claimed">claimed</option>
                  <option value="unknown">unknown</option>
                </select>
              </label>
            </div>
          </section>

          <ReadOnlyTicketQueue
            tickets={filteredTickets}
            selectedTicketId={selectedTicketId}
            onSelectTicket={setSelectedTicketId}
          />
          <ReadOnlyTicketDetail
            ticket={selectedTicket}
            canTriage={canTriageSelected}
            isTriageInProgress={triageInProgress}
            triageMessage={triageMessage}
            triageError={triageError}
            onTriage={handleTriageTicketAction}
            draftText={draftText}
            canDraft={canDraftReplySelected}
            isDraftInProgress={draftInProgress}
            draftMessage={draftMessage}
            draftError={draftError}
            onDraftTextChange={setDraftText}
            onDraft={handleDraftReplyAction}
            canRequestApproval={canRequestApprovalSelected}
            isApprovalRequestInProgress={approvalRequestInProgress}
            approvalRequestMessage={approvalRequestMessage}
            approvalRequestError={approvalRequestError}
            onRequestApproval={handleRequestApprovalAction}
            canDecideApproval={canDecideApprovalSelected}
            isApprovalDecisionInProgress={approvalDecisionInProgress}
            approvalDecisionMessage={approvalDecisionMessage}
            approvalDecisionError={approvalDecisionError}
            onApproveReply={handleApproveReplyAction}
            onRejectReply={handleRejectReplyAction}
            canSendReply={canSendReplySelected}
            isSendReplyInProgress={sendReplyInProgress}
            sendReplyMessage={sendReplyMessage}
            sendReplyError={sendReplyError}
            onSendReply={handleSendReplyAction}
            closureNote={closureNote}
            canCloseTicket={canCloseTicketSelected}
            isCloseTicketInProgress={closeTicketInProgress}
            closeTicketMessage={closeTicketMessage}
            closeTicketError={closeTicketError}
            onClosureNoteChange={setClosureNote}
            onCloseTicket={handleCloseTicketAction}
          />

          <section className="phase4a-card">
            <h2>Audit Trail</h2>
            {auditTimeline.length === 0 ? (
              <p className="placeholder-meta phase7-empty-state" role="status">
                No audit events to display for the current selection.
              </p>
            ) : (
              <div className="placeholder-table">
                {auditTimeline.map((event) => (
                  <article key={event.id} className="placeholder-row">
                    <div>
                      <strong>{event.eventType}</strong> for {event.ticketId}
                    </div>
                    <div className="placeholder-meta">
                      {event.summary} · actor: {event.actor} · {event.occurredAt}
                    </div>
                    <button type="button" disabled>
                      View details (read-only)
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="phase4a-card">
            <h2>Approval Queue</h2>
            {(approvalQueue ?? []).length === 0 ? (
              <p className="placeholder-meta phase7-empty-state" role="status">
                No approval records are awaiting review.
              </p>
            ) : (
              <div className="placeholder-table">
                {(approvalQueue ?? []).map((item) => (
                  <article key={item.id} className="placeholder-row">
                    <div>
                      <strong>{item.id}</strong> ({item.ticketId})
                    </div>
                    <div className="placeholder-meta">
                      Requested by {item.requestBy} · state: {item.state} · {item.submittedAt}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="phase4a-card">
            <h2>Communication Records</h2>
            <p className="placeholder-meta phase7-empty-state" role="status">
              No communication records are surfaced in the read-only UI yet.
            </p>
            <p className="placeholder-meta">
              Replies are persistence-only: when a reply is sent it is recorded locally as a communication row
              with no provider and no real email delivery. A read-only view of these records is a later phase.
            </p>
          </section>

          <section className="phase4a-card">
            <h2>System Status / Validation Placeholder</h2>
            <ul>
            <li>Read-only data mode: {readOnlyMode}.</li>
            <li>Live read-only mode is intentionally guarded by explicit environment flags.</li>
            <li>Route files: not introduced in this phase.</li>
            <li>Live writes/mutations: triage/draft/approval/send (local-only, no provider)/close in guarded mode.</li>
            <li>Auth/email/provider: not added.</li>
          </ul>
        </section>
        </main>
      </div>
    </div>
  );
}
