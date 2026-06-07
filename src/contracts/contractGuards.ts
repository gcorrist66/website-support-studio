import { ActorRole, TicketStatus, IdentityConfidence, TicketPriority } from "../domain/ticketStatus";
import type {
  ActorContext,
  BlockTicketRequest,
  CloseTicketRequest,
  SendApprovedReplyRequest,
  TenantContext,
} from "./ticketWorkflowContracts";

const tenantContextKeys: (keyof TenantContext)[] = ["agencyId", "clientId", "siteId"];
const actorContextKeys: (keyof ActorContext)[] = ["actorRole", "actorReference"];

export function hasRequiredTenantContext(tenantContext: unknown): tenantContext is TenantContext {
  if (tenantContext === null || typeof tenantContext !== "object") {
    return false;
  }

  const candidate = tenantContext as TenantContext;
  return tenantContextKeys.every((key) => typeof candidate[key] === "string" && candidate[key].trim().length > 0);
}

export function hasRequiredActorContext(actorContext: unknown): actorContext is ActorContext {
  if (actorContext === null || typeof actorContext !== "object") {
    return false;
  }

  const candidate = actorContext as ActorContext;
  return (
    actorContextKeys.every((key) => typeof candidate[key] === "string" && candidate[key].trim().length > 0)
    && Object.values(ActorRole).includes(candidate.actorRole)
  );
}

export function assertTenantContext(tenantContext: unknown): void {
  if (!hasRequiredTenantContext(tenantContext)) {
    throw new Error("tenant context missing or incomplete");
  }
}

export function assertActorContext(actorContext: unknown): void {
  if (!hasRequiredActorContext(actorContext)) {
    throw new Error("actor context missing or incomplete");
  }
}

export function assertSendRequiresApprovalContext(request: SendApprovedReplyRequest): void {
  if (typeof request.recipientEmail !== "string" || request.recipientEmail.trim().length === 0) {
    throw new Error("send request must include recipientEmail");
  }
  if (request.approvalContext?.approvalId?.trim().length === 0 || request.approvalContext?.approvedByActorReference?.trim().length === 0) {
    throw new Error("approval context missing required values");
  }
  if (request.approvalContext.approvedAt?.trim().length === 0) {
    throw new Error("approval context requires approvedAt");
  }
}

export function assertCloseRequiresClosureNote(request: CloseTicketRequest): void {
  if (request.closureNote.trim().length === 0) {
    throw new Error("closureNote is required");
  }
}

export function hasNoProviderContractHints(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return !/provider|smtp|sendgrid|postmark|resend|mailgun|ses|sns|mailer/i.test(serialized);
}

export function isAllowedGuardRole(actorRole: ActorRole): boolean {
  return [
    ActorRole.CS_AGENT,
    ActorRole.AGENCY_ADMIN,
    ActorRole.GARY_APPROVER,
    ActorRole.SYSTEM,
  ].includes(actorRole);
}

export function assertBlockContext(blockRequest: BlockTicketRequest): void {
  if (blockRequest.reasonDetail.trim().length === 0) {
    throw new Error("block reasonDetail required");
  }
  if (blockRequest.blockerOwner.length === 0) {
    throw new Error("blockerOwner required");
  }
}

export function isKnownPriority(value: unknown): value is TicketPriority {
  return Object.values(TicketPriority).includes(value as TicketPriority);
}

export function isKnownIdentityConfidence(value: unknown): value is IdentityConfidence {
  return Object.values(IdentityConfidence).includes(value as IdentityConfidence);
}

export function isKnownStatus(value: unknown): value is TicketStatus {
  return Object.values(TicketStatus).includes(value as TicketStatus);
}
