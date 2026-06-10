import { useEffect, useMemo, useState } from "react";

import { LogoLockup } from "../brand/LogoLockup";
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
import { operatorWorkflow } from "../../data/operatorWorkflow";
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
import { LoginShell } from "../auth/LoginShell";
import { SessionSourcePrototype } from "../auth/SessionSourcePrototype";
import { buildLoginShellState, type LoginShellStatus } from "../../auth/loginShellState";
import { OperatorPilotStatusCard } from "../operator/OperatorPilotStatusCard";
import { LaunchAccountPreview } from "../operator/LaunchAccountPreview";
import {
  createDisabledSessionReadState,
  createExistingSessionShapeReadState,
  createSyntheticSessionReadState,
  describeDevSessionReadState,
  DEV_SESSION_READ_MODE_OPTIONS,
  type DevSupabaseSessionReadMode,
} from "../../auth/devSupabaseSessionRead";

function formatOperatorDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getUniqueCount(items: Array<{ clientId?: string; siteId?: string }>, key: "clientId" | "siteId"): number {
  return new Set(
    items.map((item) => item[key]).filter((value): value is string => typeof value === "string" && value.trim().length > 0),
  ).size;
}

function getRecentItems(items: MockTicketQueueItem[], limit = 3): MockTicketQueueItem[] {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}

export function AppShell() {
  const showDevelopmentPrototype =
    typeof import.meta !== "undefined" ? (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false : false;
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
  const [viewMode, setViewMode] = useState<"workspace" | "auth_simulator">("workspace");
  const [loginShellStatus, setLoginShellStatus] = useState<LoginShellStatus>("loading");
  const [sessionReadMode, setSessionReadMode] = useState<DevSupabaseSessionReadMode>("disabled");
  const [sessionReadPrincipalId, setSessionReadPrincipalId] = useState("");
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

  const operatorSummary = useMemo(() => {
    const activeTickets = ticketQueueData.filter((ticket) => ticket.status !== "closed");
    const blockedTickets = activeTickets.filter((ticket) => ticket.status === "blocked");
    const urgentTickets = activeTickets.filter(
      (ticket) => ticket.priority === "urgent" || ticket.priority === "critical",
    );
    const recentTickets = getRecentItems(ticketQueueData);

    return {
      activeCustomers: getUniqueCount(activeTickets, "clientId"),
      openRequests: activeTickets.length,
      pendingApprovals: approvalQueue.length,
      activeProjects: getUniqueCount(activeTickets, "siteId"),
      waitingOnUs: Math.max(activeTickets.length - blockedTickets.length, 0),
      waitingOnCustomer: blockedTickets.length,
      recentTickets,
      atRiskTickets: blockedTickets.length > 0 ? blockedTickets : urgentTickets,
    };
  }, [approvalQueue, ticketQueueData]);

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

    if (operatorWorkflow.isLive()) {
      try {
        await operatorWorkflow.triage(selectedTicket.workflowId, "Manual CS triage from operator console");
      } catch (e) {
        setTriageError(e instanceof Error ? e.message : "Triage failed.");
        setTriageInProgress(false);
        return;
      }
      const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
      const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.id);
      setSelectedTicket(refreshed);
      setAuditTimeline(timeline);
      setTriageMessage(`Ticket ${selectedTicket.id} triaged successfully.`);
      setTriageInProgress(false);
      return;
    }

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

    if (operatorWorkflow.isLive()) {
      try {
        await operatorWorkflow.draftReply(selectedTicket.workflowId, normalizedDraftText);
      } catch (e) {
        setDraftError(e instanceof Error ? e.message : "Draft failed.");
        setDraftInProgress(false);
        return;
      }
      const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
      const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.id);
      setSelectedTicket(refreshed);
      setAuditTimeline(timeline);
      setDraftMessage(`Draft created for ticket ${selectedTicket.id}.`);
      setDraftText("");
      setDraftInProgress(false);
      return;
    }

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

    if (operatorWorkflow.isLive()) {
      try {
        await operatorWorkflow.requestApproval(selectedTicket.workflowId);
      } catch (e) {
        setApprovalRequestError(e instanceof Error ? e.message : "Request approval failed.");
        setApprovalRequestInProgress(false);
        return;
      }
      const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
      const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.id);
      setSelectedTicket(refreshed);
      setAuditTimeline(timeline);
      setApprovalRequestMessage(`Gary approval requested for ticket ${selectedTicket.id}.`);
      setApprovalRequestInProgress(false);
      return;
    }

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

    if (operatorWorkflow.isLive()) {
      try {
        if (decision === "approve") {
          await operatorWorkflow.approve(selectedTicket.workflowId, "Approved by Gary from operator console");
        } else {
          await operatorWorkflow.reject(selectedTicket.workflowId, "Returned for rework by Gary");
        }
      } catch (e) {
        setApprovalDecisionError(e instanceof Error ? e.message : "Approval decision failed.");
        setApprovalDecisionInProgress(false);
        return;
      }
      const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
      const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.id);
      setSelectedTicket(refreshed);
      setAuditTimeline(timeline);
      setApprovalDecisionMessage(
        decision === "approve"
          ? `Reply approved for ticket ${selectedTicket.id}.`
          : `Reply rejected for ticket ${selectedTicket.id}.`,
      );
      setApprovalDecisionInProgress(false);
      return;
    }

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

    if (operatorWorkflow.isLive()) {
      try {
        await operatorWorkflow.send(selectedTicket.workflowId);
      } catch (e) {
        setSendReplyError(e instanceof Error ? e.message : "Send failed.");
        setSendReplyInProgress(false);
        return;
      }
      const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
      const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.id);
      setSelectedTicket(refreshed);
      setAuditTimeline(timeline);
      setSendReplyMessage(`Reply sent for ticket ${selectedTicket.id}.`);
      setSendReplyInProgress(false);
      return;
    }

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

    if (operatorWorkflow.isLive()) {
      try {
        await operatorWorkflow.close(selectedTicket.workflowId, normalizedClosureNote);
      } catch (e) {
        setCloseTicketError(e instanceof Error ? e.message : "Close failed.");
        setCloseTicketInProgress(false);
        return;
      }
      const refreshed = await getReadOnlyTicketDetail(selectedTicket.id);
      const timeline = await getReadOnlyTicketAuditTimeline(selectedTicket.id);
      setSelectedTicket(refreshed);
      setAuditTimeline(timeline);
      setCloseTicketMessage(`Ticket ${selectedTicket.id} closed.`);
      setCloseTicketInProgress(false);
      return;
    }

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

  // Phase 7D: local auth-state simulation. Builds the modeled shell state for the selected status.
  // The operator-active state reuses a dev operator session so the workspace preview is realistic.
  // SIMULATOR only — no real auth, no redirects, no route protection.
  const loginShellState = useMemo(() => {
    const sampleSession = getActiveOperatorSession(createDevRoleSwitcherAuthState("agency_admin"));
    return buildLoginShellState(loginShellStatus, sampleSession);
  }, [loginShellStatus]);

  // In simulator view, the workspace is shown only when the simulated state grants operator access.
  // In workspace view it always shows (current behavior). No real protection — visualization only.
  const showWorkspace = viewMode === "workspace" || (viewMode === "auth_simulator" && loginShellState.canAccessWorkspace);

  // Phase 7H: dev-only session-read preview. Feeds a plain (synthetic / existing-shape) session into
  // the existing read path → principal → pipeline → operator session → flags. READ-ONLY: no real auth,
  // no redirects, no writes, no operator linking. Resolves against the in-memory dev preview rows.
  const devSessionReadState = useMemo(() => {
    const id = sessionReadPrincipalId.trim();
    if (sessionReadMode === "synthetic_session") {
      return createSyntheticSessionReadState(
        { id, expiresAtIso: "2999-01-01T00:00:00.000Z" },
        DEV_PREVIEW_OPERATOR_ROWS,
      );
    }
    if (sessionReadMode === "existing_session_shape") {
      const session = id ? { user: { id }, expires_at: 32503680000 } : null;
      return createExistingSessionShapeReadState(session, DEV_PREVIEW_OPERATOR_ROWS);
    }
    return createDisabledSessionReadState();
  }, [sessionReadMode, sessionReadPrincipalId]);

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
  const showPilotStatusCard = Boolean(selectedTicket?.tenantContext?.clientId);

  return (
    <div className="phase4a-shell">
      <header className="phase4a-header">
        <div style={{ display: "grid", gap: 6 }}>
          <LogoLockup size={32} variant="light" />
          <h1 className="phase4a-header-title">Operator Console</h1>
          <p className="brand-kicker phase4a-header-kicker">Operational command center</p>
        </div>
        <span className="status-pill">{getReadOnlyModeLabel()}</span>
      </header>

      <div className="phase4a-layout">
        <nav className="phase4a-nav" aria-label="Primary">
          <h2>Navigation</h2>
          <ul>
            <li>Overview</li>
            <li>Queue</li>
            <li>Approvals</li>
            <li>Activity</li>
            <li>Health</li>
          </ul>
        </nav>

        <main className="phase4a-main">
          <LaunchAccountPreview
            orgId={selectedTicket.tenantContext.clientId}
            customerLabel={selectedTicket.tenantContext.clientName}
            siteLabel={selectedTicket.tenantContext.siteName}
          />

          <section className="phase4a-card operator-overview-card">
            <div className="operator-overview-header">
              <div>
                <p className="pilot-status-kicker">operator overview</p>
                <h2>Business status</h2>
                <p className="placeholder-meta">
                  The first screen is the business state: who is active, what needs attention, and what changed
                  recently.
                </p>
              </div>
              <span className="pilot-status-badge pilot-status-badge-blue">live queue</span>
            </div>

            <div className="operator-overview-grid">
              <article className="operator-overview-metric">
                <p className="operator-overview-label">Active customers</p>
                <p className="operator-overview-value">{operatorSummary.activeCustomers}</p>
                <p className="operator-overview-note">customers with open work in the queue</p>
              </article>
              <article className="operator-overview-metric">
                <p className="operator-overview-label">Open requests</p>
                <p className="operator-overview-value">{operatorSummary.openRequests}</p>
                <p className="operator-overview-note">requests waiting on action or follow-up</p>
              </article>
              <article className="operator-overview-metric">
                <p className="operator-overview-label">Pending approvals</p>
                <p className="operator-overview-value">{operatorSummary.pendingApprovals}</p>
                <p className="operator-overview-note">items waiting on Gary approval</p>
              </article>
              <article className="operator-overview-metric">
                <p className="operator-overview-label">Active projects</p>
                <p className="operator-overview-value">{operatorSummary.activeProjects}</p>
                <p className="operator-overview-note">sites with current work in motion</p>
              </article>
              <article className="operator-overview-metric">
                <p className="operator-overview-label">Workload</p>
                <p className="operator-overview-value">
                  {operatorSummary.waitingOnUs} / {operatorSummary.waitingOnCustomer}
                </p>
                <p className="operator-overview-note">waiting on us / waiting on customer</p>
              </article>
              <article className="operator-overview-metric">
                <p className="operator-overview-label">What’s new</p>
                <ul className="operator-mini-list">
                  {operatorSummary.recentTickets.map((ticket) => (
                    <li key={ticket.id}>
                      <strong>{ticket.id}</strong> {ticket.title}
                      <span className="operator-mini-list-meta">
                        {ticket.clientName} · {formatOperatorDateTime(ticket.updatedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="operator-risk-band">
              <p className="operator-risk-label">What is at risk</p>
              {operatorSummary.atRiskTickets.length > 0 ? (
                <ul className="operator-risk-list">
                  {operatorSummary.atRiskTickets.slice(0, 3).map((ticket) => (
                    <li key={ticket.id}>
                      <strong>{ticket.id}</strong> {ticket.title} · {ticket.priority}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="placeholder-meta">No blocked or urgent tickets are currently visible.</p>
              )}
            </div>
          </section>

          {showDevelopmentPrototype ? (
            <>
              <section className="phase4a-card phase7-auth-view">
                <h2>Access controls</h2>
                <p className="placeholder-meta">
                  Local-only view of auth transitions. No real auth, no redirects, and no route protection.
                </p>
                <fieldset className="phase6-auth-mode">
                  <legend>Mode</legend>
                  <label>
                    <input
                      type="radio"
                      name="wss-auth-view"
                      value="workspace"
                      checked={viewMode === "workspace"}
                      onChange={() => setViewMode("workspace")}
                    />
                    Operator workspace
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="wss-auth-view"
                      value="auth_simulator"
                      checked={viewMode === "auth_simulator"}
                      onChange={() => setViewMode("auth_simulator")}
                    />
                    Auth state
                  </label>
                </fieldset>
                <p className="placeholder-meta">Current state: {loginShellState.label}</p>
              </section>

              {viewMode === "auth_simulator" && (
                <LoginShell state={loginShellState} status={loginShellStatus} onSelectStatus={setLoginShellStatus} />
              )}

              {showWorkspace && (
                <>
                  <section className="phase4a-card phase6-operator-card">
                    <h2>Operator access</h2>
                    <p className="placeholder-meta">
                      Read-only operator access only. This is not a sign-in and performs no credential check. It shows
                      role-based action visibility from a synthetic in-memory operator session.
                    </p>

                    <fieldset className="phase6-auth-mode">
                      <legend>Access mode</legend>
                      <label>
                        <input
                          type="radio"
                          name="wss-dev-auth-mode"
                          value="dev_role_switcher"
                          checked={authMode === "dev_role_switcher"}
                          onChange={() => setAuthMode("dev_role_switcher")}
                        />
                        Role switcher
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="wss-dev-auth-mode"
                          value="adapter_principal"
                          checked={authMode === "adapter_principal"}
                          onChange={() => setAuthMode("adapter_principal")}
                        />
                        Principal mapping
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
                          (id only). The linkage source of truth is auth_user_id.
                        </p>
                        <label className="phase6-operator-switcher">
                          Principal preset
                          <select value={adapterPrincipalId} onChange={(event) => setAdapterPrincipalId(event.target.value)}>
                            <option value="">- none -</option>
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
                            placeholder="synthetic uuid"
                          />
                        </label>
                        <p className="placeholder-meta" role="status">
                          {operatorSession
                            ? `Resolved operator session: ${operatorSession.displayName} · role ${operatorSession.role}`
                            : adapterPrincipalId.trim()
                              ? "No linked operator for this principal."
                              : "Enter or select a synthetic auth principal id to resolve the adapter result."}
                        </p>
                      </div>
                    )}

                    <p className="placeholder-meta">
                      {operatorSession
                        ? `Active operator: ${operatorSession.displayName} · role ${operatorSession.role}`
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

                  <section className="phase4a-card phase7-session-read">
                    <h2>Session mapping</h2>
                    <p className="placeholder-meta">
                      Read-only view of the session path (session → principal → pipeline → operator session →
                      capability flags). No real sign-in, no redirect, no writes, no operator linking.
                    </p>
                    <fieldset className="phase6-auth-mode">
                      <legend>Session read mode</legend>
                      {DEV_SESSION_READ_MODE_OPTIONS.map((option) => (
                        <label key={option.value}>
                          <input
                            type="radio"
                            name="wss-session-read-mode"
                            value={option.value}
                            checked={sessionReadMode === option.value}
                            onChange={() => setSessionReadMode(option.value)}
                          />
                          {option.label}
                        </label>
                      ))}
                    </fieldset>

                    {sessionReadMode !== "disabled" && (
                      <div className="phase6-adapter-preview">
                        <label className="phase6-operator-switcher">
                          Principal preset
                          <select value={sessionReadPrincipalId} onChange={(event) => setSessionReadPrincipalId(event.target.value)}>
                            <option value="">- none -</option>
                            {DEV_ADAPTER_PRINCIPAL_PRESETS.map((preset) => (
                              <option key={preset.principalId} value={preset.principalId}>
                                {preset.label} ({preset.principalId})
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="phase6-operator-switcher">
                          Synthetic session principal id
                          <input
                            type="text"
                            value={sessionReadPrincipalId}
                            onChange={(event) => setSessionReadPrincipalId(event.target.value)}
                            placeholder="synthetic uuid"
                          />
                        </label>
                      </div>
                    )}

                    <div className="phase7-session-read-panel" role="status" aria-live="polite">
                      <p className="placeholder-meta">Mode: {describeDevSessionReadState(devSessionReadState.mode)}</p>
                      <p className="placeholder-meta">
                        Principal extracted: {devSessionReadState.principal ? devSessionReadState.principal.id : "none"}
                      </p>
                      <p className="placeholder-meta">
                        Operator session:{" "}
                          {devSessionReadState.adapterResult?.session
                          ? `resolved — ${devSessionReadState.adapterResult.session.displayName} · role ${devSessionReadState.adapterResult.session.role}`
                          : "not resolved"}
                      </p>
                      {sessionReadMode !== "disabled" && sessionReadPrincipalId.trim() && !devSessionReadState.adapterResult?.session && (
                        <p className="placeholder-meta">No linked operator for this session principal.</p>
                      )}
                    </div>

                    <ul className="phase6-capability-list">
                      <li>Create ticket: {devSessionReadState.capabilityFlags.canSeeCreateTicket ? "visible" : "hidden"}</li>
                      <li>Triage: {devSessionReadState.capabilityFlags.canSeeTriage ? "visible" : "hidden"}</li>
                      <li>Draft reply: {devSessionReadState.capabilityFlags.canSeeDraftReply ? "visible" : "hidden"}</li>
                      <li>Request approval: {devSessionReadState.capabilityFlags.canSeeRequestApproval ? "visible" : "hidden"}</li>
                      <li>Approve / Reject: {devSessionReadState.capabilityFlags.canSeeApproveReply ? "visible" : "hidden"}</li>
                      <li>Send reply: {devSessionReadState.capabilityFlags.canSeeSendReply ? "visible" : "hidden"}</li>
                      <li>Close ticket: {devSessionReadState.capabilityFlags.canSeeCloseTicket ? "visible" : "hidden"}</li>
                      <li>Operator admin: {devSessionReadState.capabilityFlags.canSeeOperatorAdmin ? "visible" : "hidden"}</li>
                    </ul>
                  </section>

                  <SessionSourcePrototype />

                  <section className="phase4a-card">
                    <h2>Operational state</h2>
                    <p>Data mode and available actions are shown below.</p>
                    <dl className="phase7-status-list">
                      <div>
                        <dt>Data mode</dt>
                        <dd>
                          {readOnlyMode === "supabase-dev-readonly"
                            ? "Read-only data mode — live data is visible, but writes stay disabled."
                            : "Demo data mode — sample tickets are shown until read-only data is available."}
                        </dd>
                      </div>
                      <div>
                        <dt>Workflow mode</dt>
                        <dd>
                          {readOnlyMode === "supabase-dev-readonly"
                            ? "Workflow mode — triage → draft → request approval → approve/reject → send (local-only) → close."
                            : "Workflow actions are inactive until read-only data is available."}
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
                          Saved locally only. A sent reply is recorded locally; no real email is delivered. Approval is required before send.
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="phase4a-card">
                    <h2>Environment guardrails</h2>
                    <ul>
                      <li>Read-only data mode: {readOnlyMode}.</li>
                      <li>Guarded read-only data is enabled only by explicit environment flags.</li>
                      <li>Live writes/mutations: triage/draft/approval/send (local-only, no provider)/close in guarded mode.</li>
                      <li>Auth/email/provider: not added.</li>
                    </ul>
                  </section>
                </>
              )}
            </>
          ) : null}

          {capabilities.canSeeCreateTicket ? (
            <CreateTicketForm />
          ) : (
            <section className="phase4a-card">
              <h2>Create ticket</h2>
              <p className="placeholder-meta phase7-empty-state" role="status">
                New support requests are hidden for the current operator role.
              </p>
            </section>
          )}

          <section className="phase4a-card phase4d-search-panel">
            <h2>Search and Filters</h2>
            <p className="placeholder-meta">
              {readOnlyMode === "supabase-dev-readonly"
                ? "All results are loaded from read-only data. Search and filtering are read-only."
                : "Demo data mode until read-only data is available. Search and filtering are read-only."}
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
              Replies are saved locally: when a reply is sent it is recorded locally as a communication row
              with no provider and no real email delivery. A read-only view of these records comes later.
            </p>
          </section>

          {showPilotStatusCard ? (
            <OperatorPilotStatusCard
              clientId={selectedTicket.tenantContext.clientId}
              customerLabel={selectedTicket.tenantContext.clientName}
              siteLabel={selectedTicket.tenantContext.siteName}
            />
          ) : null}

        </main>
      </div>
    </div>
  );
}
