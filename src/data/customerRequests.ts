/**
 * Customer request submission — data access.
 *
 * Sites are read RLS-scoped (the customer only sees their own org's sites). Ticket creation goes
 * exclusively through the submit_customer_request SECURITY DEFINER RPC — the browser never inserts
 * tickets directly and never handles agency/client IDs.
 */
import { getAuthClient } from "../auth/realAuthClient";

export interface SiteOption {
  id: string;
  name: string;
}

export async function listMySites(): Promise<SiteOption[]> {
  const client = getAuthClient();
  if (!client) {
    return [];
  }
  const { data, error } = await client.from("sites").select("id,name").order("name");
  if (error || !data) {
    return [];
  }
  return data as SiteOption[];
}

export interface SubmitRequestInput {
  siteId: string;
  title: string;
  description: string;
  priority: string;
}

export interface SubmitRequestResult {
  ticket_id: string;
  ticket_number: string;
  status: string;
}

export async function submitCustomerRequest(input: SubmitRequestInput): Promise<SubmitRequestResult> {
  const client = getAuthClient();
  if (!client) {
    throw new Error("auth_not_configured");
  }
  const { data, error } = await client.rpc("submit_customer_request", {
    p_site_id: input.siteId,
    p_title: input.title,
    p_description: input.description,
    p_priority: input.priority,
  });
  if (error || !data) {
    throw new Error(error?.message ?? "submit_failed");
  }
  return data as SubmitRequestResult;
}
