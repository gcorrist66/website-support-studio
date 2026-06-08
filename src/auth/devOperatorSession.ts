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

/**
 * DEV-ONLY in-memory fixture representing EXISTING operator↔auth_user_id linkage state, used to
 * preview the adapter path locally. These are NOT real Supabase Auth users and are NOT written to
 * any database — they are a synthetic preview fixture so the UI can demonstrate
 * `resolveOperatorSessionFromAuthPrincipal` resolving (or not) without DB access or any write.
 */
export interface DevAdapterPrincipalPreset {
  principalId: string;
  label: string;
  role: OperatorRole;
  email: string;
  displayName: string;
}

export const DEV_ADAPTER_PRINCIPAL_PRESETS: readonly DevAdapterPrincipalPreset[] = [
  {
    principalId: "00000000-0000-4000-8000-00000000d001",
    label: "Agency Admin (linked)",
    role: OperatorRole.AGENCY_ADMIN,
    email: "agency.admin@wss-dev.test",
    displayName: "Agency Admin (dev)",
  },
  {
    principalId: "00000000-0000-4000-8000-00000000d002",
    label: "CS Agent (linked)",
    role: OperatorRole.CS_AGENT,
    email: "cs.agent@wss-dev.test",
    displayName: "CS Agent (dev)",
  },
  {
    principalId: "00000000-0000-4000-8000-00000000d003",
    label: "Gary Approver (linked)",
    role: OperatorRole.GARY_APPROVER,
    email: "gary.approver@wss-dev.test",
    displayName: "Gary Approver",
  },
];

/** In-memory operator rows (linked to the preset principal ids) for adapter preview only. */
export const DEV_PREVIEW_OPERATOR_ROWS: readonly OperatorRow[] = DEV_ADAPTER_PRINCIPAL_PRESETS.map((preset) => ({
  ...devRow(preset.role, preset.email, preset.displayName),
  auth_user_id: preset.principalId,
}));
