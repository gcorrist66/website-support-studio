"use client";

import { useState } from "react";
import { MonoLabel, WorkspaceHeader, MetricPanel } from "@/components/admin/ui/primitives";
import {
  CC_PROSPECTS, CC_P1, CC_CBO, CC_WSS, CC_INTRYNSYNC, CC_CONVERSIONHEALTH, CC_MULTI,
  type CCProspect, type ProductFit,
} from "@/lib/cc-prospects";

const SANS = "var(--font-jetbrains-mono), monospace";

type Tab = "all" | "wss" | "cbo" | "intrynsync" | "conversionhealth";
type Filter = "all" | "P1" | "P2" | "P3";

const TABS: { id: Tab; label: string; count: number }[] = [
  { id: "all", label: "all prospects", count: CC_PROSPECTS.length },
  { id: "wss", label: "wss", count: CC_WSS.length },
  { id: "cbo", label: "cbo", count: CC_CBO.length },
  { id: "intrynsync", label: "intrynsync", count: CC_INTRYNSYNC.length },
  { id: "conversionhealth", label: "conversionhealth", count: CC_CONVERSIONHEALTH.length },
];

const PRODUCT_COLORS: Record<ProductFit, { bg: string; color: string }> = {
  "WSS":              { bg: "#FFF7ED", color: "#C2410C" },
  "CBO":              { bg: "#EFF6FF", color: "#1D4ED8" },
  "IntrynSync":       { bg: "#FAF5FF", color: "#7E22CE" },
  "ConversionHealth": { bg: "#F0FDF4", color: "#15803D" },
  "Multiple":         { bg: "#1E293B", color: "#F1F5F9" },
};

const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  P1: { bg: "#DCFCE7", color: "#166534" },
  P2: { bg: "#FEF9C3", color: "#854D0E" },
  P3: { bg: "#F1F5F9", color: "#475569" },
};

function getProspectsForTab(tab: Tab): CCProspect[] {
  switch (tab) {
    case "wss": return CC_WSS;
    case "cbo": return CC_CBO;
    case "intrynsync": return CC_INTRYNSYNC;
    case "conversionhealth": return CC_CONVERSIONHEALTH;
    default: return CC_PROSPECTS;
  }
}

export default function ProspectsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const base = getProspectsForTab(tab);
  const filtered = base
    .filter(p => filter === "all" || p.priority === filter)
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.company_name.toLowerCase().includes(q) || p.contact_name.toLowerCase().includes(q) || p.segment.toLowerCase().includes(q);
    });

  return (
    <>
      <WorkspaceHeader
        name="master prospect database"
        subtitle="Company-wide prospect database — WSS · CBO · IntrynSync · ConversionHealth. Web research only. Do NOT import into Zoho. Do NOT send outreach. Gary review required."
      />

      {/* Metrics */}
      <div style={{ marginTop: "1.75rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        <MetricPanel title="Total prospects" value={String(CC_PROSPECTS.length)} hint="Across all 4 products" tone="default" />
        <MetricPanel title="P1 prospects" value={String(CC_P1.length)} hint="Highest priority — act first" tone="ai" />
        <MetricPanel title="Multi-product" value={String(CC_MULTI.length)} hint="Qualify for 2+ products" tone="sync" />
        <MetricPanel title="Emails verified" value="0" hint="Find + verify via Hunter.io / Apollo" tone="default" />
        <MetricPanel title="LinkedIn URLs" value="29/30" hint="Matt Jesson slug TBC" tone="sync" />
      </div>

      {/* Alert */}
      <div style={{ marginTop: "1.5rem", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 16px", fontFamily: SANS, fontSize: 11, color: "#1E40AF", lineHeight: 1.7 }}>
        <strong>Constraints:</strong> Do NOT touch WSS CRM. Do NOT send messages. Do NOT send connection requests. Do NOT create campaigns. Do NOT import into Zoho. This is a planning + qualification database only.
      </div>

      {/* Tabs */}
      <div style={{ marginTop: "1.75rem", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: "1px solid var(--ix-border)", paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 700,
              padding: "8px 14px",
              background: tab === t.id ? "var(--ix-brand)" : "transparent",
              color: tab === t.id ? "#fff" : "var(--ix-text-muted)",
              border: "1px solid",
              borderColor: tab === t.id ? "var(--ix-brand)" : "transparent",
              borderBottom: tab === t.id ? "1px solid var(--ix-brand)" : "1px solid transparent",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
              position: "relative",
              bottom: -1,
            }}
          >
            <MonoLabel text={t.label} /> <span style={{ opacity: 0.7, fontSize: 10 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ marginTop: "1.25rem", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="Search company, name, segment..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ fontFamily: SANS, fontSize: 12, padding: "7px 12px", borderRadius: 8, border: "1px solid var(--ix-border)", background: "var(--ix-surface)", color: "var(--ix-text)", width: 260 }}
        />
        {(["all", "P1", "P2", "P3"] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: "6px 12px",
              borderRadius: 6, cursor: "pointer",
              background: filter === f ? (f === "all" ? "var(--ix-brand)" : PRIORITY_COLORS[f]?.bg ?? "var(--ix-surface)") : "var(--ix-surface)",
              color: filter === f ? (f === "all" ? "#fff" : PRIORITY_COLORS[f]?.color ?? "var(--ix-text)") : "var(--ix-text-muted)",
              border: "1px solid var(--ix-border)",
            }}
          >
            {f === "all" ? "all" : f}
          </button>
        ))}
        <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--ix-text-subtle)", marginLeft: "auto" }}>
          {filtered.length} of {base.length} shown
        </span>
      </div>

      {/* Table */}
      <div style={{ marginTop: "1rem", background: "var(--ix-surface)", border: "1px solid var(--ix-border)", borderRadius: 12, overflow: "hidden", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 11 }}>
          <thead>
            <tr style={{ background: "var(--ix-surface-elevated)", borderBottom: "2px solid var(--ix-border)" }}>
              {["#", "Company", "Contact", "Title", "Location", "Segment", "Product", "CBO", "IS", "CH", "Priority", "LinkedIn"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 10px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ix-text-muted)", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const pc = PRODUCT_COLORS[p.product_fit];
              const pr = PRIORITY_COLORS[p.priority];
              return (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--ix-border)" }}>
                  <td style={{ padding: "10px 10px", color: "var(--ix-text-subtle)", fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: "10px 10px" }}>
                    <div style={{ fontWeight: 700, color: "var(--ix-text-strong)", whiteSpace: "nowrap" }}>{p.company_name}</div>
                    {p.website && <div style={{ fontSize: 9, color: "var(--ix-text-subtle)", marginTop: 1 }}>{p.website}</div>}
                  </td>
                  <td style={{ padding: "10px 10px", whiteSpace: "nowrap" }}>{p.contact_name}</td>
                  <td style={{ padding: "10px 10px", color: "var(--ix-text-muted)", fontSize: 10, maxWidth: 160 }}>{p.title}</td>
                  <td style={{ padding: "10px 10px", color: "var(--ix-text-muted)", whiteSpace: "nowrap", fontSize: 10 }}>
                    {p.city}{p.state && p.city !== p.state ? `, ${p.state}` : ""}
                  </td>
                  <td style={{ padding: "10px 10px", color: "var(--ix-text-muted)", fontSize: 10, whiteSpace: "nowrap" }}>{p.segment}</td>
                  <td style={{ padding: "10px 10px" }}>
                    <span style={{ ...pc, padding: "3px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>{p.product_fit}</span>
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "center" }}>
                    {p.qualification_cbo && <span style={{ color: "#1D4ED8", fontWeight: 800, fontSize: 12 }}>✓</span>}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "center" }}>
                    {p.qualification_intrynsync && <span style={{ color: "#7E22CE", fontWeight: 800, fontSize: 12 }}>✓</span>}
                  </td>
                  <td style={{ padding: "10px 10px", textAlign: "center" }}>
                    {p.qualification_conversionhealth && <span style={{ color: "#15803D", fontWeight: 800, fontSize: 12 }}>✓</span>}
                  </td>
                  <td style={{ padding: "10px 10px" }}>
                    <span style={{ ...pr, padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{p.priority}</span>
                  </td>
                  <td style={{ padding: "10px 10px" }}>
                    {p.linkedin_profile_url ? (
                      <a href={`https://${p.linkedin_profile_url}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--wordmark-blue)", fontWeight: 700, fontSize: 11, textDecoration: "none" }}>↗ LI</a>
                    ) : (
                      <span style={{ color: "var(--ix-text-subtle)", fontSize: 10 }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div style={{ marginTop: "1.5rem", fontFamily: SANS, fontSize: 11, color: "var(--ix-text-subtle)", lineHeight: 1.8 }}>
        <strong>Source:</strong> Web research (LinkedIn public profiles, company websites, Crunchbase, industry directories, podcast appearances).
        No data from scrapers or paid databases. No emails verified (0/30) — use Hunter.io / Apollo / Clearbit before outreach.
        No relationship degree filled in — Gary must manually check LinkedIn to determine 1st/2nd/3rd.
        <br />
        <strong>Next step:</strong> Gary reviews all 30 LinkedIn profiles → fills in relationship degree → verifies emails → GO signal for import and outreach.
      </div>
    </>
  );
}
