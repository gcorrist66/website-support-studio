import fs from "node:fs";
import path from "node:path";

const sourceRoots = [
  path.join(process.cwd(), "src", "components"),
  path.join(process.cwd(), "src", "data"),
  path.join(process.cwd(), "src", "ui"),
  path.join(process.cwd(), "src", "handlers"),
  path.join(process.cwd(), "src", "services"),
  path.join(process.cwd(), "src", "contracts"),
];

const readOnlyDataFile = path.join(process.cwd(), "src", "data", "readOnlyTicketData.ts");

const mutationInDataRegex = /(?:\.|\b)(insert|update|delete|upsert|rpc)\s*\(/i;
const mutationButtonRegex = /<(?:button|a)\b[^>]*>([\s\S]*?)<\/(?:button|a)>/gi;
const serviceRoleKeyRegex = /WSS_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|WSS_SUPABASE_SERVICE_ROLE/i;
const customerCommunicationKeywords = /customer communication|send customer|send to customer|communication provider|resend|smtp|postmark|sendgrid|mailgun/i;
const anonKeyEnvPattern = /WSS_SUPABASE_ANON_KEY|VITE_SUPABASE_ANON_KEY|VITE_SUPABASE_PUBLIC_ANON_KEY/i;
const serviceRoleEnvPattern = /WSS_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY|SERVICE_ROLE/i;
function walkFiles(directory, acc = []) {
  if (!fs.existsSync(directory)) {
    return acc;
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", "dist", ".git", ".supabase"].includes(entry.name)) {
        continue;
      }
      walkFiles(fullPath, acc);
      continue;
    }

    if (/\.(ts|tsx|js)$/.test(entry.name)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function hasRouteLikeFiles(files) {
  return files.filter((file) => /[\\/](app|pages)[\\/]api[\\/]/.test(file) || /[\\/]routes[\\/]/.test(file) || /[\\/]api[\\/]\w+\.(ts|tsx|js|jsx)$/.test(file));
}

function hasNoMutatingQueries(filePath, text) {
  return {
    filePath,
    passed: !mutationInDataRegex.test(text),
  };
}

function hasMockFallback(text) {
  return /createMockFallback|ticketQueue\b|mockData/.test(text);
}

function hasReadOnlyFallbackAssertions(text) {
  return (
    /return\s+createMockFallbackQueue\(/.test(text) &&
    /return\s+createMockFallbackDetail\(/.test(text) &&
    /return\s+createMockFallbackAuditTrail\(/.test(text)
  );
}

function usesAnonOnlyClientEnv(text) {
  return anonKeyEnvPattern.test(text) && !serviceRoleEnvPattern.test(text);
}

function hasReadOnlyModeCopy(text) {
  return /Mock data mode|Live read-only data|read-only|guard|dev mode/.test(text);
}

function noAuthAddedInUI(text) {
  const uiAuthPatterns = [
    /next-auth/i,
    /from\s+["'][^"']*auth/i,
    /supabase\.auth/i,
    /OAuth/i,
    /authenticate/i,
    /login|logout/i,
    /bearer/i,
  ];
  return !uiAuthPatterns.some((pattern) => pattern.test(text));
}

function noServiceRoleInSrc(text) {
  return !serviceRoleKeyRegex.test(text);
}

function hasDisabledMutationControls(text) {
  const buttons = text.match(mutationButtonRegex) ?? [];
  const actionRegex = /(send|approve|close|approve|create|close ticket|approval|approve reply)/i;

  const activeControls = buttons.filter((block) => {
    const isDisabled = /\bdisabled\b/i.test(block);
    const usesAction = actionRegex.test(block);
    return usesAction && !isDisabled;
  });

  return activeControls.length === 0;
}

function hasNoMutationHandlerInUI(text, filePath = "") {
  if (/[\\/]components[\\/]shell[\\/]AppShell\.tsx$/.test(filePath)) {
    const allowedMutationHandlerUse = /handleTriageTicket|handleDraftReply/.test(text);
    const disallowedHandlerUse =
      /handleCreateTicket|handleRequestApproval|handleApproveReply|handleRejectReply|handleSendApprovedReply|handleCloseTicket|handleBlockTicket|handleUnblockTicket/.test(
        text,
      );
    if (allowedMutationHandlerUse && !disallowedHandlerUse) {
      return true;
    }
  }

  return !/from\s+["'][^"']*ticketWorkflowService|ticketWorkflowHandlers|ticketWorkflowService/.test(text);
}

function uiUsesNoMutationDataPath(text) {
  return /getReadOnlyTicketDetail|getReadOnlyTicketQueue|getReadOnlyDataMode|getReadOnlyApprovalQueue|getReadOnlyTicketAuditTimeline/.test(text);
}

const allFiles = sourceRoots.flatMap((root) => walkFiles(root, []));

const checks = [];

const readOnlyText = readFile(readOnlyDataFile);
const dataMutationCheck = hasNoMutatingQueries(readOnlyDataFile, readOnlyText);
checks.push({
  name: "read-only data layer performs no insert/update/delete/upsert/rpc",
  passed: dataMutationCheck.passed,
  detail: dataMutationCheck.passed
    ? "no mutating or rpc helper patterns detected"
    : `${readOnlyDataFile} contains mutating query terms`,
});

checks.push({
  name: "read-only data layer includes mock fallback path",
  passed: hasMockFallback(readOnlyText),
  detail: hasMockFallback(readOnlyText) ? "mock fallback detected" : "mock fallback logic not detected",
});

checks.push({
  name: "read-only data layer keeps live mode explicit and mock fallback branches present",
  passed: hasReadOnlyFallbackAssertions(readOnlyText),
  detail: hasReadOnlyFallbackAssertions(readOnlyText)
    ? "guarded live mode and explicit mock fallback returns detected"
    : "read-only layer missing one or more explicit mock fallback returns",
});

checks.push({
  name: "read-only data layer uses anon-style env keys only",
  passed: usesAnonOnlyClientEnv(readOnlyText),
  detail: usesAnonOnlyClientEnv(readOnlyText)
    ? "createClient uses anon/env-style key names only"
    : "service-role-related env pattern detected in read-only layer",
});

const routeLike = hasRouteLikeFiles(allFiles);
checks.push({
  name: "no API route-like directories or files",
  passed: routeLike.length === 0,
  detail: routeLike.length === 0 ? "no route-like paths in src" : routeLike.join(", "),
});

const readOnlyUiFile = path.join(process.cwd(), "src", "components", "shell", "AppShell.tsx");
const uiText = readFile(readOnlyUiFile);

checks.push({
  name: "UI displays read-only mode copy",
  passed: hasReadOnlyModeCopy(uiText),
  detail: hasReadOnlyModeCopy(uiText)
    ? "read-only mode copy exists"
    : "read-only mode copy is missing or too terse",
});

checks.push({
  name: "UI uses read-only data path",
  passed: uiUsesNoMutationDataPath(uiText),
  detail: uiUsesNoMutationDataPath(uiText)
    ? "read-only data path referenced"
    : "read-only data helper functions were not referenced in shell",
});

checks.push({
  name: "UI has no active send/approve/close mutation controls",
  passed: hasDisabledMutationControls(uiText),
  detail: hasDisabledMutationControls(uiText)
    ? "mutation controls require disabled"
    : "found active mutation wording without disabled keyword",
});

checks.push({
  name: "UI does not import mutation handlers",
  passed: hasNoMutationHandlerInUI(uiText, readOnlyUiFile),
  detail: hasNoMutationHandlerInUI(uiText)
    ? "no mutation handler import detected"
    : "found mutation handler usage/import in UI",
});

checks.push({
  name: "no service-role key reference in UI/browser source",
  passed:
    noServiceRoleInSrc(uiText) &&
    noServiceRoleInSrc(readOnlyText) &&
    allFiles.every((file) => noServiceRoleInSrc(readFile(file))),
  detail:
    noServiceRoleInSrc(uiText) && noServiceRoleInSrc(readOnlyText)
      ? "no service role key tokens detected in src"
      : "service role key reference detected in UI/browser path",
});

checks.push({
  name: "no customer communication/provider references in read-only layer",
  passed: !customerCommunicationKeywords.test(readOnlyText) && !customerCommunicationKeywords.test(uiText),
  detail: !customerCommunicationKeywords.test(readOnlyText) && !customerCommunicationKeywords.test(uiText)
    ? "customer communication phrases not detected"
    : "customer communication/provision provider language detected",
});

checks.push({
  name: "no auth introduced in UI shell",
  passed: allFiles.every((file) => {
    if (/[\\/]components[\\/].*AppShell\.tsx$/.test(file)) {
      const text = readFile(file);
      return noAuthAddedInUI(text);
    }
    return true;
  }),
  detail: "auth keywords not found in AppShell UI shell code",
});

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) {
  console.log(JSON.stringify({ status: "fail", checks, failures: failed }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ status: "pass", checks }, null, 2));
