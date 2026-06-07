import fs from "node:fs";
import path from "node:path";

const checks = [];
const failures = [];

function mark(name, passed, detail) {
  checks.push({ name, passed, detail });
  if (!passed) {
    failures.push(`${name}: ${detail}`);
  }
}

function walkFiles(dirPath, collector) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if ([".git", "node_modules", "dist", ".next"].includes(entry.name)) {
        continue;
      }
      walkFiles(fullPath, collector);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (/(\.|\.m)js$/.test(entry.name)) {
      collector.push(fullPath);
    }
  }
}

function listSourceFiles() {
  const files = [];
  walkFiles(process.cwd(), files);
  return files.filter((filePath) => filePath.includes(`${path.sep}src${path.sep}`));
}

function hasPublicRouteFiles(files) {
  return files.some((filePath) => {
    const normalized = filePath.replaceAll("\\", "/");
    return /\/(app|pages|routes)\/(api|api\/)\//.test(normalized) || /\/src\/(app|pages|routes)\//.test(normalized);
  });
}

function hasAuthBypassHelpers(files) {
  const patterns = [
    /skipAuth\b/i,
    /bypassAuth\b/i,
    /trustProxyAuth\b/i,
    /auth.*disabled\b/i,
    /no.*auth\b/i,
  ];
  const findings = [];

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    if (!/src[\\/]handlers[\\/]/.test(file)) {
      continue;
    }
    if (patterns.some((pattern) => pattern.test(text))) {
      findings.push(file);
    }
  }

  return findings;
}

function scanForProviderOrFetchCallsInHandlers(files) {
  const providerPatterns = [
    /\bfetch\(/i,
    /\baxios\b/i,
    /\bXMLHttpRequest\b/i,
    /\brequire\([^)]*nodemailer|resend|sendgrid|postmark|mailgun|ses|provider|smtp\b/i,
    /\bprovider\b/i,
    /\bproviderConfig\b/i,
    /\bsendEmail\b/i,
    /\bdeliver\w*Email\b/i,
  ];

  const findings = [];

  for (const file of files) {
    if (!/src[\\/]handlers[\\/]/.test(file)) {
      continue;
    }
    const text = fs.readFileSync(file, "utf8");
    const hits = providerPatterns
      .map((pattern, index) => ({ pattern, index }))
      .filter(({ pattern }) => pattern.test(text))
      .map(({ index }) => index);

    if (hits.length > 0) {
      findings.push(file);
    }
  }

  return findings;
}

function scanHandlerShape(files) {
  const findings = [];

  for (const file of files) {
    if (!/src[\\/]handlers[\\/]/.test(file)) {
      continue;
    }

    const text = fs.readFileSync(file, "utf8");
    const hasFunctionExport = /export\s+function\s+handle/i.test(text) || /export\s+const\s+handle/i.test(text);
    if (!hasFunctionExport) {
      findings.push(file);
    }

    const referencesApi = new RegExp(
      "\\bfrom\\s+['\"](express|next|koa|hono|fastify|@hono|@types/express|next/server|next/headers|next-auth|@clerk|axios|fetch-api|isomorphic-fetch)\\b",
      "i",
    ).test(text);
    if (referencesApi) {
      findings.push(file);
    }
  }

  return Array.from(new Set(findings));
}

function scanForTicketMutationEndpointHints() {
  const files = listSourceFiles();
  const mutationTerms = [
    /app\.\w*\.post\(/i,
    /router\.post\(/i,
    /post\(["'`]\/tickets/i,
    /\bPATCH\s+\/tickets/i,
    /\bDELETE\s+\/tickets/i,
    /\bPOST\s+\/api\/tickets/i,
  ];

  const findings = [];
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (mutationTerms.some((re) => re.test(content))) {
      findings.push(file);
    }
  }

  return findings;
}

function run() {
  const sourceFiles = listSourceFiles();

  const publicRoutesExist = hasPublicRouteFiles(sourceFiles);
  mark("no public route files in source", !publicRoutesExist, `public route-like path exists: ${publicRoutesExist}`);

  const routeDirs = sourceFiles
    .filter((file) => /\/(app|pages|routes)\//.test(file.replaceAll("\\", "/")))
    .map((file) => file.replaceAll("\\", "/"));
  mark("no exposed route-like directories", routeDirs.length === 0, `found route-like directories: ${routeDirs.join(", ")}`);

  const handlerShapeIssues = scanHandlerShape(sourceFiles);
  mark("handlers remain local exported functions", handlerShapeIssues.length === 0, `handler files with non-local/framework coupling: ${handlerShapeIssues.join(", ")}`);

  const providerCalls = scanForProviderOrFetchCallsInHandlers(sourceFiles);
  mark("no fetch/provider calls in handlers", providerCalls.length === 0, `handlers contain external/provider calls: ${providerCalls.join(", ")}`);

  const authBypass = hasAuthBypassHelpers(sourceFiles);
  mark("no auth bypass helper in handlers", authBypass.length === 0, `auth bypass helper patterns found: ${authBypass.join(", ")}`);

  const mutationEndpointHints = scanForTicketMutationEndpointHints();
  mark("no public ticket mutation endpoint constructs", mutationEndpointHints.length === 0, `found route-like mutation patterns in: ${mutationEndpointHints.join(", ")}`);

  const customerProviderCalls = sourceFiles
    .filter((file) => /src[\\/]handlers[\\/]/.test(file))
    .filter((file) => /send|provider|smtp|mail|email/i.test(fs.readFileSync(file, "utf8")));
  mark(
    "no customer send provider in handlers",
    customerProviderCalls.length === 0,
    `customer provider hints in handlers: ${customerProviderCalls.join(", ")}`,
  );

  if (failures.length > 0) {
    console.log(JSON.stringify({ status: "fail", checks, errors: failures }, null, 2));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: "pass",
        checks,
        summary: {
          total: checks.length,
          passed: checks.filter((check) => check.passed).length,
          failed: failures.length,
        },
      },
      null,
      2,
    ),
  );
}

run();
