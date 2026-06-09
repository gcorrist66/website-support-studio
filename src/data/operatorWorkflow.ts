/**
 * Operator delivery — live write path.
 *
 * Calls the deterministic, RLS-enforced, Gary-gated workflow RPCs via the operator's authenticated
 * Supabase session. `isLive()` is true only when a real auth client exists; the console uses these
 * for real operators and falls back to the in-memory dev workflow service otherwise.
 */
import { getAuthClient } from "../auth/realAuthClient";

async function call(fn: string, args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const client = getAuthClient();
  if (!client) {
    throw new Error("auth_not_configured");
  }
  const { data, error } = await client.rpc(fn, args);
  if (error || !data) {
    throw new Error(error?.message ?? `${fn}_failed`);
  }
  return data as Record<string, unknown>;
}

export const operatorWorkflow = {
  /** True when a real operator session can perform live writes. */
  isLive(): boolean {
    return Boolean(getAuthClient());
  },
  triage(ticketId: string, summary?: string) {
    return call("operator_triage_ticket", { p_ticket_id: ticketId, p_summary: summary ?? null });
  },
  draftReply(ticketId: string, body: string) {
    return call("operator_draft_reply", { p_ticket_id: ticketId, p_body: body });
  },
  requestApproval(ticketId: string) {
    return call("operator_request_approval", { p_ticket_id: ticketId });
  },
  approve(ticketId: string, note?: string) {
    return call("operator_approve_reply", { p_ticket_id: ticketId, p_note: note ?? null });
  },
  reject(ticketId: string, note?: string) {
    return call("operator_reject_reply", { p_ticket_id: ticketId, p_note: note ?? null });
  },
  send(ticketId: string, recipientEmail?: string) {
    return call("operator_send_reply", { p_ticket_id: ticketId, p_recipient_email: recipientEmail ?? null });
  },
  close(ticketId: string, note?: string) {
    return call("operator_close_ticket", { p_ticket_id: ticketId, p_closure_note: note ?? null });
  },
};
