/**
 * DEVELOPMENT-ONLY operator session factory for local capability preview.
 *
 * This is NOT authentication and NOT a login flow. It builds a synthetic, in-memory
 * `OperatorSession` for a chosen role so the operator workspace can preview role-based UI
 * capability gating without any runtime auth, login UI, Supabase Auth, or credentials.
 * It must never be used as a substitute for real operator authentication.
 */

import { OperatorRole, type OperatorSession } from "./authTypes";
import { createOperatorSession } from "./operatorSessionResolver";
import type { OperatorRow } from "../persistence/operatorTypes";

export type DevOperatorRoleChoice = "none" | "agency_admin" | "cs_agent" | "gary_approver";

// Synthetic dev agency fixture (matches the dev seed agency). Not a real production id.
const DEV_AGENCY_ID = "00000000-0000-4000-8000-0000000000a6";
// Far-future expiry so a local dev preview session does not silently expire mid-session.
const DEV_SESSION_EXPIRES_AT = "2999-01-01T00:00:00.000Z";

function devRow(role: OperatorRole, email: string, displayName: string): OperatorRow {
  return {
    id: `dev-${role}`,
    auth_user_id: null,
    agency_id: DEV_AGENCY_ID,
    email,
    display_name: displayName,
    role,
    status: "active",
    client_ids: null,
    site_ids: null,
    last_seen_at: null,
    created_at: "1970-01-01T00:00:00.000Z",
    updated_at: "1970-01-01T00:00:00.000Z",
  };
}

/** Build a synthetic dev operator session for the chosen role (null for "none"). */
export function buildDevOperatorSession(choice: DevOperatorRoleChoice): OperatorSession | null {
  switch (choice) {
    case "agency_admin":
      return createOperatorSession(devRow(OperatorRole.AGENCY_ADMIN, "agency.admin@wss-dev.test", "Agency Admin (dev)"), {
        expiresAtIso: DEV_SESSION_EXPIRES_AT,
      });
    case "cs_agent":
      return createOperatorSession(devRow(OperatorRole.CS_AGENT, "cs.agent@wss-dev.test", "CS Agent (dev)"), {
        expiresAtIso: DEV_SESSION_EXPIRES_AT,
      });
    case "gary_approver":
      return createOperatorSession(devRow(OperatorRole.GARY_APPROVER, "gary.approver@wss-dev.test", "Gary Approver"), {
        expiresAtIso: DEV_SESSION_EXPIRES_AT,
      });
    case "none":
    default:
      return null;
  }
}

export const DEV_OPERATOR_ROLE_OPTIONS: ReadonlyArray<{ value: DevOperatorRoleChoice; label: string }> = [
  { value: "agency_admin", label: "Agency Admin" },
  { value: "cs_agent", label: "CS Agent" },
  { value: "gary_approver", label: "Gary Approver" },
  { value: "none", label: "No operator (signed out)" },
];
