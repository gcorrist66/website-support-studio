/**
 * Phase 8A — Local ticket search/filter helpers.
 *
 * Pure, read-only, dependency-free functions over the in-memory ticket queue shape.
 * No writes, no network/fetch, no Supabase, no API routes, no auth, no service-role.
 * These operate on whatever the read-only data layer has already loaded (mock or guarded
 * Supabase read-only data) — they never fetch or mutate anything themselves.
 */

/** Minimal structural shape required for search; `MockTicketQueueItem` satisfies it. */
export interface SearchableTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  submittedBy: string;
  siteId: string;
  siteName: string;
  clientId: string;
  clientName: string;
  blockedReason?: string;
  identityConfidence: string;
}

export interface TicketSearchFilters {
  /** Free-text term matched across ticket number, title, submitter, client, site, status, priority, blocked reason, identity. */
  searchText?: string;
  status?: string;
  priority?: string;
  clientName?: string;
  siteName?: string;
  /** "all" | "blocked" | "not-blocked" */
  blocked?: string;
  identityConfidence?: string;
}

const ALL = "all";

/** Lowercase, trim, and collapse internal whitespace for stable matching. */
export function normalizeSearchTerm(term: string | undefined | null): string {
  if (typeof term !== "string") {
    return "";
  }
  return term.trim().replace(/\s+/g, " ").toLowerCase();
}

function isAll(value: string | undefined): boolean {
  return value === undefined || value === ALL || value === "";
}

function isBlocked(ticket: SearchableTicket): boolean {
  return ticket.status === "blocked";
}

/**
 * True when the (already-normalized) term is empty, or appears in any searchable field:
 * ticket number, title, submitter, client (name/id), site (name/id), status, priority,
 * blocked reason, identity confidence.
 */
export function ticketMatchesSearch(ticket: SearchableTicket, normalizedTerm: string): boolean {
  if (!normalizedTerm) {
    return true;
  }
  const haystack = [
    ticket.id,
    ticket.title,
    ticket.submittedBy,
    ticket.clientName,
    ticket.clientId,
    ticket.siteName,
    ticket.siteId,
    ticket.status,
    ticket.priority,
    ticket.blockedReason ?? "",
    ticket.identityConfidence,
  ]
    .join("  ")
    .toLowerCase();
  return haystack.includes(normalizedTerm);
}

/**
 * Apply free-text + structured filters. Pure: returns a new array and never mutates input.
 * Generic so callers retain their concrete ticket type.
 */
export function filterTickets<T extends SearchableTicket>(tickets: T[], filters: TicketSearchFilters = {}): T[] {
  const term = normalizeSearchTerm(filters.searchText);
  const blocked = filters.blocked;

  return tickets.filter((ticket) => {
    if (!ticketMatchesSearch(ticket, term)) {
      return false;
    }
    if (!isAll(filters.status) && ticket.status !== filters.status) {
      return false;
    }
    if (!isAll(filters.priority) && ticket.priority !== filters.priority) {
      return false;
    }
    if (!isAll(filters.clientName) && ticket.clientName !== filters.clientName) {
      return false;
    }
    if (!isAll(filters.siteName) && ticket.siteName !== filters.siteName) {
      return false;
    }
    if (!isAll(filters.identityConfidence) && ticket.identityConfidence !== filters.identityConfidence) {
      return false;
    }
    if (blocked === "blocked" && !isBlocked(ticket)) {
      return false;
    }
    if (blocked === "not-blocked" && isBlocked(ticket)) {
      return false;
    }
    return true;
  });
}

/** Human-readable summary of the active filters and result count, for UI display. */
export function getSearchFilterSummary(filters: TicketSearchFilters, resultCount: number): string {
  const parts: string[] = [`${resultCount} ticket(s)`];
  const term = normalizeSearchTerm(filters.searchText);
  if (term) {
    parts.push(`search: "${term}"`);
  }
  if (!isAll(filters.status)) {
    parts.push(`status: ${filters.status}`);
  }
  if (!isAll(filters.priority)) {
    parts.push(`priority: ${filters.priority}`);
  }
  if (!isAll(filters.clientName)) {
    parts.push(`client: ${filters.clientName}`);
  }
  if (!isAll(filters.siteName)) {
    parts.push(`site: ${filters.siteName}`);
  }
  if (!isAll(filters.identityConfidence)) {
    parts.push(`identity: ${filters.identityConfidence}`);
  }
  if (filters.blocked === "blocked") {
    parts.push("blocked only");
  } else if (filters.blocked === "not-blocked") {
    parts.push("not blocked");
  }
  return parts.join(" · ");
}
