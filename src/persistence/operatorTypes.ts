/**
 * Phase 6D — Operator persistence shapes.
 *
 * Row/Insert shapes for the `public.operators` table (Phase 6C migration) plus the operator
 * status vocabulary. Pure types/constants — no Supabase client, no Supabase Auth runtime,
 * no service-role usage. Role values reuse the local auth `OperatorRole` (src/auth).
 */

import { OperatorRole } from "../auth/authTypes";

/** Operator lifecycle status — mirrors the DB `public.operator_status` enum. */
export type OperatorStatus = "active" | "invited" | "suspended" | "archived";

export const OPERATOR_STATUSES: readonly OperatorStatus[] = [
  "active",
  "invited",
  "suspended",
  "archived",
];

export const OPERATOR_ROLES: readonly OperatorRole[] = [
  OperatorRole.AGENCY_ADMIN,
  OperatorRole.CS_AGENT,
  OperatorRole.GARY_APPROVER,
];

/** A persisted operators row as read from the database. */
export interface OperatorRow {
  id: string;
  auth_user_id: string | null;
  agency_id: string;
  email: string;
  display_name: string;
  role: OperatorRole;
  status: OperatorStatus;
  client_ids: string[] | null;
  site_ids: string[] | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

/** An operators insert payload (db-defaulted fields optional). */
export interface OperatorInsert {
  id?: string;
  auth_user_id?: string | null;
  agency_id: string;
  email: string;
  display_name: string;
  role: OperatorRole;
  status?: OperatorStatus;
  client_ids?: string[] | null;
  site_ids?: string[] | null;
  last_seen_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Validation result shape used by the operator validators. */
export interface OperatorValidationResult {
  ok: boolean;
  errors: string[];
}

export function isOperatorRole(value: unknown): value is OperatorRole {
  return typeof value === "string" && (OPERATOR_ROLES as readonly string[]).includes(value);
}

export function isOperatorStatus(value: unknown): value is OperatorStatus {
  return typeof value === "string" && (OPERATOR_STATUSES as readonly string[]).includes(value);
}

/** Normalize an operator email the same way the DB constraint expects (trimmed + lowercase). */
export function normalizeOperatorEmail(email: string): string {
  return email.trim().toLowerCase();
}
