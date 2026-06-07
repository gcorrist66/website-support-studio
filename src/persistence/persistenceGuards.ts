import { ActorRole, TicketPriority, TicketStatus } from "../domain/ticketStatus";
import { canTransition } from "../domain/transitions";
import {
  validatePersistenceAuditEventShape,
  validatePersistenceTicketShape,
} from "./ticketMappers";

export function validateTenantIds(ids: {
  agencyId?: string;
  clientId?: string;
  siteId?: string;
}): void {
  if (!ids.agencyId || !ids.clientId || !ids.siteId) {
    throw new Error("Missing required tenant id");
  }
}

export function validateTransitionPath(from: TicketStatus, to: TicketStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid_transition_${from}_to_${to}`);
  }

  if (from === TicketStatus.CLOSED) {
    throw new Error("closed_is_terminal");
  }
}

export function assertActorCanPersist(actorRole: unknown): ActorRole {
  if (Object.values(ActorRole).includes(actorRole as ActorRole)) {
    return actorRole as ActorRole;
  }

  throw new Error(`invalid_actor_role_${String(actorRole)}`);
}

export function assertPriority(value: unknown): TicketPriority {
  if (Object.values(TicketPriority).includes(value as TicketPriority)) {
    return value as TicketPriority;
  }

  throw new Error(`invalid_priority_${String(value)}`);
}

export function validatePersistenceArtifacts(args: {
  ticket?: ReturnType<typeof validatePersistenceTicketShape>;
  audit?: ReturnType<typeof validatePersistenceAuditEventShape>;
}): void {
  const errors: string[] = [];

  if (args.ticket && !args.ticket.ok) {
    errors.push(...args.ticket.errors);
  }

  if (args.audit && !args.audit.ok) {
    errors.push(...args.audit.errors);
  }

  if (errors.length > 0) {
    throw new Error(`persistence_validation_failed: ${errors.join(", ")}`);
  }
}
