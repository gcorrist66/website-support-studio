#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { auditWebsite } from "../src/lib/websiteHealthAudit.mjs";

async function loadLocalEnv() {
  const envPath = path.resolve(import.meta.dirname, "../.env.local");
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key && process.env[key] == null) process.env[key] = value;
    }
  } catch {
    // Optional local file. Production/batch environments can use real env vars.
  }
}

function parseArgs(argv) {
  const args = { delayMs: 1500, retries: 2 };
  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input" || value === "-i") args.input = argv[++index];
    else if (value === "--output" || value === "-o") args.output = argv[++index];
    else if (value === "--endpoint") args.endpoint = argv[++index];
    else if (value === "--limit") args.limit = Number(argv[++index]);
    else if (value === "--delay-ms") args.delayMs = Number(argv[++index]);
    else if (value === "--retries") args.retries = Number(argv[++index]);
    else if (value === "--help" || value === "-h") args.help = true;
  }
  return args;
}

function usage() {
  return `Usage:
  node marketing/scripts/website-health-score-batch.mjs --input prospects.csv --output prospects-scored.csv [--endpoint https://example.com/api/website-health-audit] [--limit 5] [--delay-ms 1500] [--retries 2]

Required input column:
  website_url

Added output columns:
  health_score, findability_score, tier, routing_tag, top_3_issues, findability_top_issues

Optional env:
  PAGESPEED_API_KEY or GOOGLE_PAGESPEED_API_KEY, PLACES_API_KEY`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNoSite(row) {
  const websiteUrl = String(row.website_url || "").trim();
  const websitePages = String(row.website_pages || "").trim();
  return (
    !websiteUrl ||
    /^(no[-_\s]?site|none|n\/a|na|not found)$/i.test(websiteUrl) ||
    /^(no[-_\s]?site|none|n\/a|na|not found)$/i.test(websitePages)
  );
}

function noSiteAudit() {
  return {
    score: 0,
    findability_score: 0,
    tier: "At Risk",
    routing_tag: "rebuild",
    top_3_issues: "No website found — biggest opportunity.",
    findability_top_issues: "No website found — biggest opportunity.",
    pageSpeed: { available: false, error: "no_site" },
    findability: { available: true, score: 0 },
  };
}

function shouldRetryPageSpeed(audit) {
  const error = String(audit?.pageSpeed?.error || "");
  return (
    !audit?.pageSpeed?.available &&
    /(quota|rate|429|timeout|temporarily|backend|try again|unavailable)/i.test(error)
  );
}

async function auditWithRetry(row, retries, delayMs) {
  let audit = await auditWebsite(row.website_url, {
    company: row.company,
    city: row.city,
    state: row.state,
  });
  for (let attempt = 1; attempt <= retries && shouldRetryPageSpeed(audit); attempt += 1) {
    const waitMs = Math.max(delayMs, 5000) * attempt;
    process.stderr.write(`  PageSpeed unavailable (${audit.pageSpeed.error}); retry ${attempt}/${retries} after ${waitMs}ms\n`);
    await sleep(waitMs);
    audit = await auditWebsite(row.website_url, {
      company: row.company,
      city: row.city,
      state: row.state,
    });
  }
  return audit;
}

async function auditEndpoint(row, endpoint) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: row.website_url,
      company: row.company,
      city: row.city,
      state: row.state,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body?.error || `Endpoint returned ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function shouldRetryEndpoint(errorOrAudit) {
  const status = Number(errorOrAudit?.status || 0);
  const message = String(errorOrAudit?.message || errorOrAudit?.pageSpeed?.error || "");
  return status === 429 || status >= 500 || /(quota|rate|429|timeout|temporarily|backend|try again|unavailable)/i.test(message);
}

async function auditEndpointWithRetry(row, endpoint, retries, delayMs) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const audit = await auditEndpoint(row, endpoint);
      if (!shouldRetryPageSpeed(audit)) return audit;
      lastError = new Error(audit.pageSpeed?.error || "PageSpeed unavailable");
      if (attempt >= retries) return audit;
      const waitMs = Math.max(delayMs, 5000) * (attempt + 1);
      process.stderr.write(`  PageSpeed unavailable (${audit.pageSpeed?.error}); retry ${attempt + 1}/${retries} after ${waitMs}ms\n`);
      await sleep(waitMs);
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetryEndpoint(error)) throw error;
      const waitMs = Math.max(delayMs, 5000) * (attempt + 1);
      process.stderr.write(`  Endpoint unavailable (${error.message}); retry ${attempt + 1}/${retries} after ${waitMs}ms\n`);
      await sleep(waitMs);
    }
  }
  throw lastError || new Error("Endpoint audit failed");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers = [], ...dataRows] = rows.filter((items) => items.some((item) => item.trim() !== ""));
  return dataRows.map((items) => Object.fromEntries(headers.map((header, index) => [header.trim(), items[index] || ""])));
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function stringifyCsv(rows, preferredHeaders) {
  const headers = Array.from(new Set([...preferredHeaders, ...rows.flatMap((row) => Object.keys(row))]));
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n") + "\n";
}

async function main() {
  await loadLocalEnv();
  const args = parseArgs(process.argv);
  if (args.help || !args.input || !args.output) {
    console.log(usage());
    process.exit(args.help ? 0 : 1);
  }

  const inputPath = path.resolve(args.input);
  const outputPath = path.resolve(args.output);
  const csv = await fs.readFile(inputPath, "utf8");
  const rows = parseCsv(csv);
  if (!rows.length) throw new Error("No CSV rows found.");
  if (!Object.prototype.hasOwnProperty.call(rows[0], "website_url")) {
    throw new Error("Input CSV must include a website_url column.");
  }

  const limit = Number.isFinite(args.limit) && args.limit > 0 ? Math.min(args.limit, rows.length) : rows.length;
  const outputRows = [];
  const delayMs = Number.isFinite(args.delayMs) && args.delayMs >= 0 ? args.delayMs : 1500;
  const retries = Number.isFinite(args.retries) && args.retries >= 0 ? args.retries : 2;

  for (let index = 0; index < rows.length; index += 1) {
    const row = { ...rows[index] };
    if (index < limit) {
      const label = row.website_url || row.company || `row ${index + 1}`;
      process.stderr.write(`Scoring ${index + 1}/${limit}: ${label}\n`);
      const audit = isNoSite(row)
        ? noSiteAudit()
        : args.endpoint
          ? await auditEndpointWithRetry(row, args.endpoint, retries, delayMs)
          : await auditWithRetry(row, retries, delayMs);
      row.health_score = audit.score;
      row.findability_score = audit.findability_score ?? audit.findability?.score ?? "";
      row.tier = audit.tier;
      row.routing_tag = audit.routing_tag || "";
      row.top_3_issues = audit.top_3_issues;
      row.findability_top_issues = audit.findability_top_issues || "";
      if (!isNoSite(row) && !audit.pageSpeed?.available) {
        process.stderr.write(`  Warning: PageSpeed not measured for ${label}: ${audit.pageSpeed?.error || "unknown"}\n`);
      }
      if (delayMs > 0 && index < limit - 1) await sleep(delayMs);
    } else {
      row.health_score = "";
      row.findability_score = "";
      row.tier = "";
      row.routing_tag = "";
      row.top_3_issues = "";
      row.findability_top_issues = "";
    }
    outputRows.push(row);
  }

  const baseHeaders = Object.keys(rows[0]).filter((header) => !["health_score", "findability_score", "tier", "routing_tag", "top_3_issues", "findability_top_issues"].includes(header));
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, stringifyCsv(outputRows, [...baseHeaders, "health_score", "findability_score", "tier", "routing_tag", "top_3_issues", "findability_top_issues"]));
  process.stderr.write(`Wrote ${outputPath}\n`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
