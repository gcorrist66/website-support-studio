import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const searchFile = "src/search/ticketSearch.ts";

const checks = [];
const failures = [];

function mark(name, passed, detail) {
  checks.push({ name, passed, detail });
  if (!passed) {
    failures.push(`${name}: ${detail}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function transpileSearchModule() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "wss-search-boundary-validate-"));
  const targetRoot = path.join(tmpDir, "src");

  const sourceText = fs.readFileSync(path.join(projectRoot, searchFile), "utf8");
  assert(sourceText.length > 0, `Unable to load source file: ${searchFile}`);

  const output = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true,
      esModuleInterop: true,
    },
    fileName: "ticketSearch.ts",
    reportDiagnostics: true,
  });

  if (output.diagnostics && output.diagnostics.length > 0) {
    throw new Error(`TypeScript transpile failure for ${searchFile}: ${output.diagnostics[0].messageText}`);
  }

  const outputPath = path.join(targetRoot, "search", "ticketSearch.js");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output.outputText, "utf8");

  return { tmpDir, targetRoot };
}

async function loadSearchModule(targetRoot) {
  return import(pathToFileURL(path.join(targetRoot, "search", "ticketSearch.js")).href);
}

function sampleTickets() {
  return [
    {
      id: "TKT-LOCAL-1001",
      title: "Checkout button on campaign page fails",
      status: "received",
      priority: "medium",
      submittedBy: "Customer A",
      siteId: "SITE-01",
      siteName: "North Coast Site",
      clientId: "CLI-01",
      clientName: "North Coast Retail",
      identityConfidence: "known",
    },
    {
      id: "TKT-LOCAL-1002",
      title: "FAQ section shows stale pricing",
      status: "triaged",
      priority: "high",
      submittedBy: "Support Form",
      siteId: "SITE-02",
      siteName: "Acme Site",
      clientId: "CLI-02",
      clientName: "Acme Holdings",
      identityConfidence: "claimed",
    },
    {
      id: "TKT-LOCAL-1003",
      title: "Webhook not firing after checkout",
      status: "blocked",
      priority: "urgent",
      submittedBy: "Partner Bot",
      siteId: "SITE-03",
      siteName: "Pulse Lab",
      clientId: "CLI-03",
      clientName: "Pulse Labs",
      blockedReason: "customer_data_required",
      identityConfidence: "unknown",
    },
  ];
}

function ids(list) {
  return list.map((t) => t.id);
}

function runSearchScenarios(runtime) {
  const { normalizeSearchTerm, ticketMatchesSearch, filterTickets, getSearchFilterSummary } = runtime;

  // normalizeSearchTerm
  assert(normalizeSearchTerm("  Foo   Bar ") === "foo bar", "normalize should trim/collapse/lowercase");
  assert(normalizeSearchTerm(undefined) === "", "normalize should handle undefined");
  assert(normalizeSearchTerm(null) === "", "normalize should handle null");

  const tickets = sampleTickets();
  const t1 = tickets[0];
  const t3 = tickets[2];

  // ticketMatchesSearch across fields
  assert(ticketMatchesSearch(t1, "") === true, "empty term matches all");
  assert(ticketMatchesSearch(t1, normalizeSearchTerm("1001")) === true, "match by ticket number");
  assert(ticketMatchesSearch(t1, normalizeSearchTerm("checkout")) === true, "match by title");
  assert(ticketMatchesSearch(t1, normalizeSearchTerm("customer a")) === true, "match by submitter");
  assert(ticketMatchesSearch(t1, normalizeSearchTerm("north coast")) === true, "match by client/site");
  assert(ticketMatchesSearch(t1, normalizeSearchTerm("received")) === true, "match by status");
  assert(ticketMatchesSearch(t1, normalizeSearchTerm("medium")) === true, "match by priority");
  assert(ticketMatchesSearch(t1, normalizeSearchTerm("known")) === true, "match by identity confidence");
  assert(ticketMatchesSearch(t3, normalizeSearchTerm("customer_data_required")) === true, "match by blocked reason");
  assert(ticketMatchesSearch(t1, normalizeSearchTerm("nonexistent-zzz")) === false, "non-match returns false");

  // filterTickets — structured filters
  assert(ids(filterTickets(tickets, {})).length === 3, "no filters returns all");
  assert(ids(filterTickets(tickets, { status: "triaged" })).join() === "TKT-LOCAL-1002", "status filter");
  assert(ids(filterTickets(tickets, { priority: "urgent" })).join() === "TKT-LOCAL-1003", "priority filter");
  assert(ids(filterTickets(tickets, { clientName: "Acme Holdings" })).join() === "TKT-LOCAL-1002", "client filter");
  assert(ids(filterTickets(tickets, { siteName: "Pulse Lab" })).join() === "TKT-LOCAL-1003", "site filter");
  assert(ids(filterTickets(tickets, { identityConfidence: "known" })).join() === "TKT-LOCAL-1001", "identity filter");
  assert(ids(filterTickets(tickets, { blocked: "blocked" })).join() === "TKT-LOCAL-1003", "blocked filter");
  assert(ids(filterTickets(tickets, { blocked: "not-blocked" })).length === 2, "not-blocked filter");
  assert(ids(filterTickets(tickets, { searchText: "webhook" })).join() === "TKT-LOCAL-1003", "free-text filter");
  assert(
    ids(filterTickets(tickets, { searchText: "site", status: "triaged" })).join() === "TKT-LOCAL-1002",
    "combined free-text + structured filter",
  );
  assert(ids(filterTickets(tickets, { status: "closed" })).length === 0, "no match returns empty");
  assert(ids(filterTickets(tickets, { status: "all", priority: "all", blocked: "all" })).length === 3, "all == no filter");

  // purity: input not mutated
  const before = ids(tickets).join();
  filterTickets(tickets, { status: "triaged", searchText: "acme" });
  assert(ids(tickets).join() === before, "filterTickets must not mutate or reorder input");
  assert(tickets.length === 3, "input length unchanged");

  // getSearchFilterSummary
  const summary = getSearchFilterSummary({ searchText: "acme", status: "triaged" }, 1);
  assert(summary.includes("1 ticket(s)"), "summary includes result count");
  assert(summary.toLowerCase().includes("acme") && summary.includes("triaged"), "summary lists active filters");
  const emptySummary = getSearchFilterSummary({}, 3);
  assert(emptySummary.includes("3 ticket(s)"), "summary works with no active filters");

  mark("search works on local/read-only data shape", true, "normalize/match/filter/summary behave correctly");
  mark("filterTickets is pure (no writes/mutation)", true, "input array not mutated or reordered");
  mark("search matches all required fields", true, "number/title/submitter/client/site/status/priority/blocked/identity");
}

function runStaticSourceChecks() {
  const text = fs.readFileSync(path.join(projectRoot, searchFile), "utf8");

  const mutationPattern = /(?:\.|\b)(insert|update|delete|upsert|rpc)\s*\(/i;
  assert(!mutationPattern.test(text), "search helper must contain no insert/update/delete/upsert/rpc calls");
  mark("no writes in search helper", true, "no mutating query calls present");

  const networkPattern = /\bfetch\s*\(|\baxios\b|XMLHttpRequest|from\s+["']https?:\/\/|new\s+Request\(/i;
  assert(!networkPattern.test(text), "search helper must contain no network/fetch calls");
  mark("no API routes / network in search helper", true, "no fetch/axios/http/router patterns present");

  const routePattern = /\b(express|next\/server|router\.(get|post|put|patch|delete)|app\.(get|post|put|patch|delete))\b/i;
  assert(!routePattern.test(text), "search helper must not define routes");
  mark("no route definitions in search helper", true, "no express/next/router constructs present");

  const serviceRolePattern = /service_role|sb_secret_|SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY/;
  assert(!serviceRolePattern.test(text), "search helper must contain no service-role references");
  mark("no service-role usage", true, "no service_role/sb_secret/SERVICE_ROLE tokens present");

  const supabasePattern = /@supabase\/supabase-js|createClient\s*\(|supabase\.auth/i;
  assert(!supabasePattern.test(text), "search helper must not use Supabase runtime");
  mark("no supabase runtime usage", true, "no supabase client/auth usage present");

  const commsPattern = /resend|sendgrid|postmark|mailgun|nodemailer|smtp|sendEmail|customer communication/i;
  assert(!commsPattern.test(text), "search helper must contain no customer communication/provider terms");
  mark("no customer communication / provider", true, "no email provider or communication-send terms present");

  const authBypassPattern = /skipAuth|bypassAuth|disableAuth|trustProxyAuth/i;
  assert(!authBypassPattern.test(text), "search helper must contain no auth-bypass helpers");
  mark("no auth bypass", true, "no auth-bypass helper patterns present");

  // file lives under src/search, not a route directory
  const searchDir = path.join(projectRoot, "src", "search");
  const entries = fs.readdirSync(searchDir, { withFileTypes: true });
  const routeLike = entries.filter((e) => e.isDirectory() && ["app", "pages", "routes", "api"].includes(e.name));
  assert(routeLike.length === 0, "no route-like directory under src/search");
  mark("no route files created", true, "src/search contains only local search helpers");
}

async function main() {
  try {
    runStaticSourceChecks();

    const { tmpDir, targetRoot } = transpileSearchModule();
    try {
      const runtime = await loadSearchModule(targetRoot);
      runSearchScenarios(runtime);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    mark("local search-boundary validation", true, "search behavior and static safety checks passed");
    console.log(JSON.stringify({ status: "pass", checks }, null, 2));
  } catch (error) {
    mark("local search-boundary validation", false, error instanceof Error ? error.message : String(error));
    console.log(JSON.stringify({ status: "fail", checks, failures }, null, 2));
    process.exit(1);
  }
}

main();
