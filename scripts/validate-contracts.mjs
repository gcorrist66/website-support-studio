import fs from "node:fs";
import path from "node:path";

const checks = [];
const errors = [];
const addCheck = (name, passed, detail) => {
  checks.push({ name, passed, detail });
  if (!passed) {
    errors.push(`${name}: ${detail}`);
  }
};

const hasRouteFile = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const filePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      if (hasRouteFile(filePath)) {
        return true;
      }
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const normalized = filePath.replaceAll("\\", "/");
    if (/((^|\/)src\/(app\/api\/|pages\/api\/|routes\/))/.test(normalized)) {
      return true;
    }
  }

  return false;
};

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const tenantContextKeys = ["agencyId", "clientId", "siteId"];
const actorContextRoles = ["agency_admin", "client_admin", "site_user", "cs_agent", "gary_approver", "system"];

const assertTenantContext = (tenantContext) => {
  if (!tenantContext || typeof tenantContext !== "object") {
    throw new Error("tenant context missing");
  }

  for (const key of tenantContextKeys) {
    if (!isNonEmptyString(tenantContext[key])) {
      throw new Error(`tenantContext.${key} required`);
    }
  }
};

const assertActorContext = (actorContext) => {
  if (!actorContext || typeof actorContext !== "object") {
    throw new Error("actor context missing");
  }

  if (!isNonEmptyString(actorContext.actorRole) || !actorContextRoles.includes(actorContext.actorRole)) {
    throw new Error("actorRole invalid");
  }

  if (!isNonEmptyString(actorContext.actorReference)) {
    throw new Error("actorReference required");
  }
};

const assertSendRequiresApprovalContext = (sendReq) => {
  if (!isNonEmptyString(sendReq.recipientEmail)) {
    throw new Error("send request must include recipientEmail");
  }

  if (!sendReq.approvalContext || typeof sendReq.approvalContext !== "object") {
    throw new Error("approvalContext required");
  }

  const { approvalId, approvedByActorReference, approvedAt } = sendReq.approvalContext;
  if (!isNonEmptyString(approvalId) || !isNonEmptyString(approvedByActorReference) || !isNonEmptyString(approvedAt)) {
    throw new Error("approval context requires id, approver reference, and timestamp");
  }
};

const assertCloseRequiresClosureNote = (closeReq) => {
  if (!isNonEmptyString(closeReq.closureNote)) {
    throw new Error("closureNote required");
  }
};

const hasNoProviderContractHints = (value) => {
  const serialized = JSON.stringify(value);
  return !/provider|smtp|sendgrid|postmark|resend|mailgun|ses|sns|mailer/i.test(serialized);
};

const collectChecks = () => {
  const tenantContext = {
    agencyId: "agency-contracts",
    clientId: "client-contracts",
    siteId: "site-contracts",
  };

  const actorContext = {
    actorRole: "cs_agent",
    actorReference: "actor-contracts",
  };

  const createReq = {
    tenantContext,
    actorContext,
    ticket: {
      rawMessage: "Customer request with required context",
      intakeChannel: "portal",
      source: "local-docs",
      priority: "normal",
      identityConfidence: "known",
      submitter: {
        submitterName: "QA User",
        submitterEmail: "customer@example.com",
      },
      title: "Contract check",
    },
    requestId: "req-create",
    requestedAt: new Date().toISOString(),
  };

  const sendReq = {
    tenantContext,
    actorContext,
    ticketId: "ticket-contract-1",
    draftReplyId: "draft-contract-1",
    recipientEmail: "customer@example.com",
    approvalContext: {
      approvalId: "approval-contract-1",
      approvedByActorReference: "actor-gary",
      approvedAt: new Date().toISOString(),
    },
    communicationContext: {
      channel: "local_only",
    },
    rationale: "local simulation",
  };

  const closeReq = {
    tenantContext,
    actorContext,
    ticketId: "ticket-contract-1",
    closureNote: "Work completed and verified",
  };

  const malformedClose = {
    tenantContext,
    actorContext,
    ticketId: "ticket-contract-1",
    closureNote: "   ",
  };

  const malformedSend = {
    tenantContext,
    actorContext,
    ticketId: "ticket-contract-1",
    draftReplyId: "draft-contract-1",
    recipientEmail: "customer@example.com",
    approvalContext: {
      approvalId: "approval-contract-1",
      approvedByActorReference: "",
      approvedAt: new Date().toISOString(),
    },
    communicationContext: {
      channel: "local_only",
    },
  };

  const contractObjects = [createReq, sendReq, closeReq];

  return {
    tenantContext,
    actorContext,
    createReq,
    sendReq,
    closeReq,
    malformedClose,
    malformedSend,
    contractObjects,
  };
};

try {
  const {
    tenantContext,
    actorContext,
    createReq,
    sendReq,
    closeReq,
    malformedClose,
    malformedSend,
    contractObjects,
  } = collectChecks();

  const expectedChecks = [
    {
      name: "required tenant context",
      run: () => {
        assertTenantContext(tenantContext);
      },
    },
    {
      name: "required actor context",
      run: () => {
        assertActorContext(actorContext);
      },
    },
    {
      name: "create request includes actor and tenant context",
      run: () => {
        assertTenantContext(createReq.tenantContext);
        assertActorContext(createReq.actorContext);
        if (!createReq.ticket.rawMessage || !createReq.ticket.intakeChannel || !createReq.ticket.source) {
          throw new Error("create ticket payload is incomplete");
        }
      },
    },
    {
      name: "send request requires approval context",
      run: () => {
        assertSendRequiresApprovalContext(sendReq);
      },
    },
    {
      name: "close request requires closure note",
      run: () => {
        assertCloseRequiresClosureNote(closeReq);
      },
    },
    {
      name: "no provider details in contract payloads",
      run: () => {
        for (const contract of contractObjects) {
          if (!hasNoProviderContractHints(contract)) {
            throw new Error("provider-related content found in contract payload");
          }
        }
      },
    },
    {
      name: "contracts do not imply autonomous reply",
      run: () => {
        const payload = JSON.stringify(contractObjects);
        if (/autoSend|autoReply|autonomous/i.test(payload)) {
          throw new Error("autonomous reply semantics were detected");
        }
      },
    },
    {
      name: "invalid close requires validation failure",
      run: () => {
        let failed = false;
        try {
          assertCloseRequiresClosureNote(malformedClose);
        } catch {
          failed = true;
        }
        if (!failed) {
          throw new Error("malformed close payload passed unexpectedly");
        }
      },
    },
    {
      name: "invalid send approval context fails",
      run: () => {
        let failed = false;
        try {
          assertSendRequiresApprovalContext(malformedSend);
        } catch {
          failed = true;
        }
        if (!failed) {
          throw new Error("malformed send payload passed unexpectedly");
        }
      },
    },
    {
      name: "no API route files exist",
      run: () => {
        if (hasRouteFile(path.join(process.cwd(), "src"))) {
          throw new Error("API route file exists under src");
        }
      },
    },
  ];

  for (const check of expectedChecks) {
    try {
      check.run();
      addCheck(check.name, true, "pass");
    } catch (error) {
      addCheck(check.name, false, error instanceof Error ? error.message : "unexpected validation error");
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  const forbiddenProviderKeys = [
    "provider",
    "smtpHost",
    "smtpPort",
    "emailProvider",
    "providerMessageId",
    "externalProvider",
  ];
  const flat = JSON.stringify(contractObjects);
  const forbidden = forbiddenProviderKeys.filter((key) => new RegExp(key, "i").test(flat));

  addCheck(
    "forbidden provider fields absent",
    forbidden.length === 0,
    forbidden.length > 0 ? `found keys: ${forbidden.join(", ")}` : "pass",
  );

  const noRouteFile = !hasRouteFile(path.join(process.cwd(), "src"));
  addCheck("source has no API route implementation", noRouteFile, noRouteFile ? "pass" : "route implementation files detected");

  console.log(JSON.stringify({
    status: "pass",
    checks,
  }, null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("contracts validation failed:", message);
  for (const check of checks) {
    if (!check.passed) {
      console.error(`- ${check.name}: ${check.detail}`);
    }
  }
  console.error(JSON.stringify({ status: "fail", checks }, null, 2));
  process.exit(1);
}
