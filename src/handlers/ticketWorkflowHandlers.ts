import { ActorRole, TicketStatus } from "../domain/ticketStatus";
import { getApprovals, getAuditTrail } from "../domain/ticketLifecycle";
import {
  approvePersistedReply,
  blockPersistedTicket,
  closePersistedTicket,
  createPersistedTicket,
  draftPersistedReply,
  getWorkflowSession,
  rejectPersistedReply,
  requestPersistedApproval,
  sendPersistedCustomerReplyLocalOnly,
  triagePersistedTicket,
  unblockPersistedTicket,
} from "../services/ticketWorkflowService";
import {
  assertActorContext,
  assertCloseRequiresClosureNote,
  assertSendRequiresApprovalContext,
  assertTenantContext,
  hasNoProviderContractHints,
  isAllowedGuardRole,
  isKnownStatus,
} from "../contracts/contractGuards";
import type {
  ApproveReplyRequest,
  ApproveReplyResponse,
  AuditEnvelope,
  BlockTicketRequest,
  BlockTicketResponse,
  CloseTicketRequest,
  CloseTicketResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  DraftReplyRequest,
  DraftReplyResponse,
  RejectReplyRequest,
  RejectReplyResponse,
  RequestApprovalRequest,
  RequestApprovalResponse,
  SendApprovedReplyRequest,
  SendApprovedReplyResponse,
  TriageTicketRequest,
  TriageTicketResponse,
  UnblockTicketRequest,
  UnblockTicketResponse,
  AuditEventType as ContractAuditEventType,
} from "../contracts/ticketWorkflowContracts";

type HandlerSuccess<T> = {
  status: "success";
  response: T;
};

type HandlerError = {
  status: "error";
  error: string;
};

type HandlerResult<T> = HandlerSuccess<T> | HandlerError;

function fail(message: string): never {
  throw new Error(message);
}

function nowIso(): string {
  return new Date().toISOString();
}

function assertContractContext(tenantContext: unknown, actorContext: unknown): void {
  assertTenantContext(tenantContext);
  assertActorContext(actorContext);
  if (!hasNoProviderContractHints(tenantContext) || !hasNoProviderContractHints(actorContext)) {
    fail("provider-oriented fields are not allowed in handler requests");
  }
}

function assertResponseTicketContext(ticketId: string, tenantContext: { agencyId: string; clientId: string; siteId: string }) {
  const session = getWorkflowSession(ticketId);
  if (!session) {
    fail(`No workflow session found for ticket ${ticketId}`);
  }

  if (
    session.tenant.agencyId !== tenantContext.agencyId ||
    session.tenant.clientId !== tenantContext.clientId ||
    session.tenant.siteId !== tenantContext.siteId
  ) {
    fail("tenant context mismatch for ticket");
  }

  const ticketNumber = session.ticketNumber || ticketId;
  return {
    session,
    ticketNumber,
  };
}

function mapAuditTrail(ticketId: string): AuditEnvelope[] {
  return getAuditTrail(ticketId).map((event) => ({
    eventType: event.eventType as ContractAuditEventType,
    summary: event.summary,
    metadata: event.metadata,
  }));
}

function allowedActorGuard(actorRole: ActorRole): void {
  if (!isAllowedGuardRole(actorRole)) {
    fail(`actorRole ${actorRole} is not allowed for handler execution`);
  }
}

function buildResponseBase(
  ticketId: string,
  tenantContext: CreateTicketRequest["tenantContext"],
  actorContext: CreateTicketRequest["actorContext"],
  summary: string,
  status: TicketStatus,
) {
  return {
    ticketId,
    status,
    siteId: tenantContext.siteId,
    tenantContext,
    actorContext,
    summary,
    occurredAt: nowIso(),
  };
}

export function handleCreateTicket(request: CreateTicketRequest): HandlerResult<CreateTicketResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);

    const ticket = createPersistedTicket({
      tenant: {
        agencyId: request.tenantContext.agencyId,
        clientId: request.tenantContext.clientId,
        siteId: request.tenantContext.siteId,
      },
      submitter: {
        submitterName: request.ticket.submitter?.submitterName,
        submitterEmail: request.ticket.submitter?.submitterEmail,
      },
      ticket: {
        rawMessage: request.ticket.rawMessage,
        intakeChannel: request.ticket.intakeChannel,
        source: request.ticket.source,
        priority: request.ticket.priority,
        identityConfidence: request.ticket.identityConfidence,
        actorReference: request.actorContext.actorReference,
        title: request.ticket.title,
      },
    });

    const { ticketNumber } = assertResponseTicketContext(ticket.ticketId, request.tenantContext);

    return {
      status: "success",
      response: {
        ...buildResponseBase(ticket.ticketId, request.tenantContext, request.actorContext, "created ticket", ticket.status),
        ticketNumber,
        createdAt: ticket.createdAt,
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export function handleTriageTicket(request: TriageTicketRequest): HandlerResult<TriageTicketResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);
    allowedActorGuard(request.actorContext.actorRole);

    const ticket = triagePersistedTicket(
      request.ticketId,
      request.actorContext.actorReference,
      request.rationale,
    );

    assertResponseTicketContext(ticket.ticketId, request.tenantContext);

    return {
      status: "success",
      response: {
        ...buildResponseBase(ticket.ticketId, request.tenantContext, request.actorContext, "triaged ticket", ticket.status),
        triagedAt: nowIso(),
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export function handleDraftReply(request: DraftReplyRequest): HandlerResult<DraftReplyResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);
    allowedActorGuard(request.actorContext.actorRole);

    const ticket = draftPersistedReply(
      request.ticketId,
      request.draftText,
      request.actorContext.actorReference,
      {
        draftAssumptions: request.draftAssumptions,
        evidenceReference: request.evidenceReference,
        qualityCheckFlag: request.qualityCheckFlag,
      },
    );

    const { session } = assertResponseTicketContext(ticket.ticketId, request.tenantContext);
    const latestDraft = session.persistedDrafts.at(-1);
    if (!latestDraft) {
      fail("draft was not persisted");
    }

    return {
      status: "success",
      response: {
        ...buildResponseBase(
          ticket.ticketId,
          request.tenantContext,
          request.actorContext,
          "draft created",
          ticket.status,
        ),
        draftId: latestDraft.draftId,
        draftVersion: latestDraft.draftVersion,
        draftedAt: latestDraft.draftedAt,
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export function handleRequestApproval(request: RequestApprovalRequest): HandlerResult<RequestApprovalResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);
    allowedActorGuard(request.actorContext.actorRole);

    const ticket = requestPersistedApproval(
      request.ticketId,
      request.actorContext.actorReference,
      request.requestNotes,
    );

    const approval = getApprovals(request.ticketId).at(-1);
    if (!approval) {
      fail("approval record was not created");
    }

    assertResponseTicketContext(ticket.ticketId, request.tenantContext);

    return {
      status: "success",
      response: {
        ...buildResponseBase(
          ticket.ticketId,
          request.tenantContext,
          request.actorContext,
          "approval requested",
          ticket.status,
        ),
        approvalId: approval.approvalId,
        approvalRequestedAt: nowIso(),
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export function handleApproveReply(request: ApproveReplyRequest): HandlerResult<ApproveReplyResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);
    allowedActorGuard(request.actorContext.actorRole);

    if (request.actorContext.actorRole !== ActorRole.GARY_APPROVER && request.actorContext.actorRole !== ActorRole.AGENCY_ADMIN) {
      fail("only gary_approver or agency_admin may approve");
    }

    const ticket = approvePersistedReply(
      request.ticketId,
      request.actorContext.actorRole,
      request.actorContext.actorReference,
      request.approvalNotes,
    );

    const approval = getApprovals(request.ticketId).at(-1);
    if (!approval) {
      fail("approval was not persisted");
    }

    assertResponseTicketContext(ticket.ticketId, request.tenantContext);

    return {
      status: "success",
      response: {
        ...buildResponseBase(
          ticket.ticketId,
          request.tenantContext,
          request.actorContext,
          "reply approved",
          ticket.status,
        ),
        approvalId: approval.approvalId,
        approvedAt: nowIso(),
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export function handleRejectReply(request: RejectReplyRequest): HandlerResult<RejectReplyResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);
    allowedActorGuard(request.actorContext.actorRole);

    if (request.actorContext.actorRole !== ActorRole.GARY_APPROVER && request.actorContext.actorRole !== ActorRole.AGENCY_ADMIN) {
      fail("only gary_approver or agency_admin may reject");
    }

    const ticket = rejectPersistedReply(
      request.ticketId,
      request.actorContext.actorRole,
      request.actorContext.actorReference,
      request.rejectionNotes,
    );

    const approval = getApprovals(request.ticketId).at(-1);
    if (!approval) {
      fail("rejection was not persisted");
    }

    assertResponseTicketContext(ticket.ticketId, request.tenantContext);

    return {
      status: "success",
      response: {
        ...buildResponseBase(
          ticket.ticketId,
          request.tenantContext,
          request.actorContext,
          "reply rejected",
          ticket.status,
        ),
        approvalId: approval.approvalId,
        rejectedAt: nowIso(),
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export function handleSendApprovedReply(request: SendApprovedReplyRequest): HandlerResult<SendApprovedReplyResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);
    allowedActorGuard(request.actorContext.actorRole);
    assertSendRequiresApprovalContext(request);

    const approvals = getApprovals(request.ticketId);
    const latestApproval = approvals.at(-1);
    if (!latestApproval) {
      fail("no approval found for ticket");
    }

    if (latestApproval.decision !== "approved") {
      fail("approval must be granted before send");
    }

    if (latestApproval.approvalId !== request.approvalContext.approvalId) {
      fail("approval context does not match current approval");
    }

    const ticket = sendPersistedCustomerReplyLocalOnly({
      ticketId: request.ticketId,
      actorReference: request.actorContext.actorReference,
      recipientEmail: request.recipientEmail,
      rationale: request.rationale,
    });

    if (ticket.status === TicketStatus.CLOSED) {
      fail("send must not close the ticket");
    }

    const session = assertResponseTicketContext(ticket.ticketId, request.tenantContext);
    const communicationId = [...session.session.persistedCommunicationIds].at(-1);
    if (!communicationId) {
      fail("communication record was not persisted");
    }

    return {
      status: "success",
      response: {
        ...buildResponseBase(
          ticket.ticketId,
          request.tenantContext,
          request.actorContext,
          "reply sent",
          ticket.status,
        ),
        communicationId,
        sentAt: nowIso(),
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export function handleCloseTicket(request: CloseTicketRequest): HandlerResult<CloseTicketResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);
    allowedActorGuard(request.actorContext.actorRole);
    assertCloseRequiresClosureNote(request);
    const actorRole = request.actorContext.actorRole;
    if (actorRole !== ActorRole.CS_AGENT && actorRole !== ActorRole.AGENCY_ADMIN && actorRole !== ActorRole.GARY_APPROVER) {
      fail("only cs_agent, agency_admin, or gary_approver may close tickets");
    }

    const ticket = closePersistedTicket(
      request.ticketId,
      actorRole,
      request.closureNote,
      request.actorContext.actorReference,
    );

    assertResponseTicketContext(ticket.ticketId, request.tenantContext);

    return {
      status: "success",
      response: {
        ...buildResponseBase(
          ticket.ticketId,
          request.tenantContext,
          request.actorContext,
          "ticket closed",
          ticket.status,
        ),
        closedAt: nowIso(),
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export function handleBlockTicket(request: BlockTicketRequest): HandlerResult<BlockTicketResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);
    allowedActorGuard(request.actorContext.actorRole);

    if (request.reasonDetail.trim().length === 0) {
      fail("block reason detail is required");
    }

    const ticket = blockPersistedTicket(
      request.ticketId,
      request.actorContext.actorRole,
      request.blockedReason,
      request.blockerOwner,
      request.reasonDetail,
      request.actorContext.actorReference,
      request.mitigationPlan,
      request.nextAction,
    );

    assertResponseTicketContext(ticket.ticketId, request.tenantContext);

    return {
      status: "success",
      response: {
        ...buildResponseBase(
          ticket.ticketId,
          request.tenantContext,
          request.actorContext,
          "ticket blocked",
          ticket.status,
        ),
        blockedAt: nowIso(),
        blockedReason: request.blockedReason,
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

export function handleUnblockTicket(request: UnblockTicketRequest): HandlerResult<UnblockTicketResponse> {
  try {
    assertContractContext(request.tenantContext, request.actorContext);
    allowedActorGuard(request.actorContext.actorRole);

    if (!isKnownStatus(request.targetStatus)) {
      fail(`invalid targetStatus ${request.targetStatus}`);
    }

    assertResponseTicketContext(request.ticketId, request.tenantContext);
    const previousBlockedStatus = TicketStatus.BLOCKED;

    const ticket = unblockPersistedTicket(
      request.ticketId,
      request.actorContext.actorRole,
      request.targetStatus,
      request.actorContext.actorReference,
      undefined,
      request.unblockNotes,
    );

    if (ticket.status === TicketStatus.BLOCKED) {
      fail("ticket remained blocked after unblock request");
    }

    return {
      status: "success",
      response: {
        ...buildResponseBase(
          ticket.ticketId,
          request.tenantContext,
          request.actorContext,
          "ticket unblocked",
          ticket.status,
        ),
        unblockedAt: nowIso(),
        previousBlockedStatus,
        auditEvents: mapAuditTrail(ticket.ticketId),
      },
    };
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : String(error) };
  }
}
