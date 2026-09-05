"use client";

import { useState } from "react";
import Link from "next/link";
import { WSS_LIVE_PROSPECTS, WSS_PROSPECTS, WSS_CAMPAIGN_B, type WSSProspect } from "@/lib/wss-prospects";

const SANS = "var(--font-jetbrains-mono), monospace";
const SHOT_TYPES = ["homepage", "hero", "mobile", "portal"] as const;

// ─── Angle helpers ────────────────────────────────────────────────────────────

function angleShort(angle: string) {
  if (angle.startsWith("A")) return "A — proof";
  if (angle.startsWith("B")) return "B — screenshot";
  if (angle.startsWith("C")) return "C — cx";
  if (angle.startsWith("D")) return "D — quality";
  return angle;
}

function AnglePill({ angle }: { angle: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    A: { bg: "#FFF7ED", color: "#C2410C" },
    B: { bg: "#EFF6FF", color: "#1D4ED8" },
    C: { bg: "#F0FDF4", color: "#15803D" },
    D: { bg: "#FAF5FF", color: "#7E22CE" },
  };
  const key = angle.charAt(0).toUpperCase();
  const s = styles[key] ?? { bg: "var(--ix-surface-elevated)", color: "var(--ix-text-muted)" };
  return (
    <span style={{ ...s, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: SANS, whiteSpace: "nowrap" }}>
      {angleShort(angle)}
    </span>
  );
}


function PriorityBadge({ p }: { p: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    P1: { bg: "#DCFCE7", color: "#166534" },
    P2: { bg: "#FEF9C3", color: "#854D0E" },
    P3: { bg: "#F1F5F9", color: "#475569" },
  };
  const s = map[p] ?? { bg: "var(--ix-surface-elevated)", color: "var(--ix-text-muted)" };
  return <span style={{ ...s, padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: SANS }}>{p}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const isReady = status === "ready";
  const isEmail = status === "email needed";
  const bg = isReady ? "#DCFCE7" : isEmail ? "#FEF9C3" : "#FEE2E2";
  const color = isReady ? "#166534" : isEmail ? "#854D0E" : "#991B1B";
  return <span style={{ background: bg, color, padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: SANS, whiteSpace: "nowrap" }}>{status}</span>;
}

// ─── Tab 1: Screenshot Review ─────────────────────────────────────────────────

function ScreenshotReview() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      {/* Info bar */}
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 16px", fontSize: 12, color: "#1E40AF", marginBottom: 24, lineHeight: 1.7, fontFamily: SANS }}>
        <strong>Screenshot review — Gary approval required before any outreach.</strong> Blue-highlighted shot = recommended primary for this prospect. Images load from <code style={{ background: "#DBEAFE", padding: "1px 5px", borderRadius: 3 }}>/wss/screenshots/</code> in public/. Click any image to open full-size.
      </div>

      {/* Top 10 send table */}
      <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: "var(--ix-text-strong)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>Top 10 send recommendations</h3>
      <div style={{ background: "var(--ix-surface)", border: "1px solid var(--ix-border)", borderRadius: 10, overflow: "hidden", marginBottom: 36 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--ix-surface-elevated)", borderBottom: "2px solid var(--ix-border)" }}>
                {["#", "Business", "Primary screenshot", "Angle", "Subject line", "Email", "Priority", "Preview"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ix-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WSS_LIVE_PROSPECTS.map((p, i) => (
                <tr key={p.slug} style={{ borderBottom: "1px solid var(--ix-border)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 15, color: i < 3 ? "var(--ix-brand)" : "var(--ix-text-subtle)" }}>#{i + 1}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, color: "var(--ix-text-strong)" }}>{p.business_name}</div>
                    <div style={{ fontSize: 10, color: "var(--ix-text-subtle)", marginTop: 2 }}>{p.industry}</div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <code style={{ fontSize: 10, background: "var(--ix-surface-elevated)", padding: "2px 6px", borderRadius: 4, color: "var(--ix-text-muted)" }}>{p.slug}/{p.primary_screenshot_type}.png</code>
                  </td>
                  <td style={{ padding: "10px 12px" }}><AnglePill angle={p.outreach_angle} /></td>
                  <td style={{ padding: "10px 12px", maxWidth: 240 }}>
                    <span style={{ fontSize: 10, fontStyle: "italic", color: "var(--ix-text-muted)", display: "block", lineHeight: 1.5 }}>&ldquo;{p.subject_line}&rdquo;</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: "var(--ix-text)" }}>{p.email || <span style={{ color: "var(--ix-text-subtle)", fontSize: 10 }}>needs research</span>}</td>
                  <td style={{ padding: "10px 12px" }}><PriorityBadge p={p.priority} /></td>
                  <td style={{ padding: "10px 12px" }}>
                    {p.preview_url && (
                      <a href={p.preview_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: "var(--wordmark-blue)", textDecoration: "none" }}>↗ view</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prospect cards */}
      <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: "var(--ix-text-strong)", margin: "0 0 16px", letterSpacing: "-0.01em" }}>All prospect screenshots</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        {WSS_LIVE_PROSPECTS.map((p) => (
          <div key={p.slug} style={{ background: "var(--ix-surface)", border: "1px solid var(--ix-border)", borderRadius: 12, overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--ix-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 800, color: "var(--ix-text-strong)", letterSpacing: "-0.02em" }}>{p.business_name}</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: "var(--ix-text-subtle)", marginTop: 3 }}>
                  {p.industry} · {p.slug} · score {p.score}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <PriorityBadge p={p.priority} />
                <StatusBadge status={p.status} />
                {p.preview_url && (
                  <a href={p.preview_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: "#fff", background: "var(--ix-brand)", textDecoration: "none", padding: "5px 12px", borderRadius: 6 }}>↗ Preview</a>
                )}
              </div>
            </div>

            {/* Screenshot grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--ix-border)" }}>
              {SHOT_TYPES.map((type) => {
                const isPrimary = p.primary_screenshot_type === type;
                const imgSrc = `/wss/screenshots/${p.slug}/${type}.png`;
                return (
                  <div key={type} style={{ background: "var(--ix-surface)", ...(isPrimary ? { borderTop: "3px solid var(--ix-brand)" } : {}) }}>
                    <div style={{ padding: "7px 10px", background: isPrimary ? "#EFF6FF" : "var(--ix-surface-elevated)", borderBottom: "1px solid var(--ix-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: isPrimary ? "var(--ix-brand)" : "var(--ix-text-muted)" }}>{type}</span>
                      <span style={{ fontFamily: SANS, fontSize: 9, color: "var(--ix-text-subtle)" }}>
                        {type === "homepage" ? "1280×800" : type === "hero" ? "1280×~500" : type === "mobile" ? "390×844" : "1280×600"}
                      </span>
                      {isPrimary && <span style={{ background: "var(--ix-brand)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, fontFamily: SANS }}>PRIMARY</span>}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt={`${p.business_name} ${type}`}
                      onClick={() => window.open(imgSrc)}
                      style={{ width: "100%", height: 140, objectFit: "cover", objectPosition: "top", display: "block", cursor: "pointer" }}
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.style.display = "none";
                        if (t.nextElementSibling) (t.nextElementSibling as HTMLElement).style.display = "flex";
                      }}
                    />
                    <div style={{ height: 140, display: "none", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: "var(--ix-text-subtle)", fontSize: 11, fontFamily: SANS, background: "var(--ix-surface-muted)" }}>
                      <span style={{ fontSize: 20 }}>📸</span>
                      <span style={{ textAlign: "center" }}>copy to<br /><code style={{ fontSize: 9 }}>public/wss/screenshots/{p.slug}/</code></span>
                    </div>
                    <div style={{ padding: "6px 10px" }}>
                      <code style={{ fontSize: 9, color: "var(--ix-text-subtle)" }}>{p.slug}/{type}.png</code>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rec bar */}
            <div style={{ padding: "12px 20px", background: "#F8FAFC", borderTop: "1px solid var(--ix-border)", display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "start" }}>
              <div><AnglePill angle={p.outreach_angle} /></div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11, fontStyle: "italic", color: "var(--ix-text-muted)", marginBottom: 4 }}>&ldquo;{p.subject_line}&rdquo;</div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: "var(--ix-text-subtle)" }}>Primary: {p.primary_screenshot_type} — {p.screenshots_status === "captured" ? "✓ captured" : "pending"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 2: Outreach Tracker ──────────────────────────────────────────────────

type SortKey = "priority" | "score" | "status" | "business_name";

function OutreachTracker() {
  const [sort, setSort] = useState<SortKey>("score");
  const [filter, setFilter] = useState<"all" | "ready" | "p1">("all");

  const filtered = WSS_PROSPECTS.filter(p => {
    if (filter === "ready") return p.status === "ready";
    if (filter === "p1") return p.priority === "P1";
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "score") return b.score - a.score;
    if (sort === "priority") {
      const ord: Record<string, number> = { P1: 0, P2: 1, P3: 2 };
      return (ord[a.priority] ?? 3) - (ord[b.priority] ?? 3);
    }
    if (sort === "status") return a.status.localeCompare(b.status);
    return a.business_name.localeCompare(b.business_name);
  });

  const readyCount = WSS_PROSPECTS.filter(p => p.status === "ready").length;
  const emailNeeded = WSS_PROSPECTS.filter(p => p.status === "email needed").length;
  const contactNeeded = WSS_PROSPECTS.filter(p => p.status === "contact info needed").length;
  const previewPending = WSS_PROSPECTS.filter(p => p.screenshots_status === "preview_not_built").length;

  return (
    <div>
      {/* Status summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Ready to send", value: readyCount, bg: "#DCFCE7", color: "#166534" },
          { label: "Email needed", value: emailNeeded, bg: "#FEF9C3", color: "#854D0E" },
          { label: "Contact needed", value: contactNeeded, bg: "#FEE2E2", color: "#991B1B" },
          { label: "Preview pending", value: previewPending, bg: "#F1F5F9", color: "#475569" },
        ].map(({ label, value, bg, color }) => (
          <div key={label} style={{ background: bg, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color, marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: SANS, fontSize: 32, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--ix-text-muted)", fontWeight: 600 }}>Filter:</span>
        {(["all", "ready", "p1"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6, border: "1px solid var(--ix-border)", cursor: "pointer", background: filter === f ? "var(--ix-brand)" : "var(--ix-surface)", color: filter === f ? "#fff" : "var(--ix-text-muted)" }}>
            {f === "all" ? "all prospects" : f === "ready" ? "ready to send" : "P1 only"}
          </button>
        ))}
        <span style={{ fontFamily: SANS, fontSize: 11, color: "var(--ix-text-muted)", fontWeight: 600, marginLeft: 12 }}>Sort:</span>
        {(["score", "priority", "status", "business_name"] as const).map(s => (
          <button key={s} onClick={() => setSort(s)} style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6, border: "1px solid var(--ix-border)", cursor: "pointer", background: sort === s ? "var(--ix-surface-elevated)" : "var(--ix-surface)", color: sort === s ? "var(--ix-text-strong)" : "var(--ix-text-muted)" }}>
            {s === "business_name" ? "name" : s}
          </button>
        ))}
      </div>

      {/* Tracker table */}
      <div style={{ background: "var(--ix-surface)", border: "1px solid var(--ix-border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--ix-surface-elevated)", borderBottom: "2px solid var(--ix-border)" }}>
                {["Score", "Business", "Owner", "Contact", "Industry", "Angle", "Priority", "Status", "Screenshots", "Preview", "Subject line"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ix-text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.slug} style={{ borderBottom: "1px solid var(--ix-border)", opacity: p.screenshots_status === "preview_not_built" ? 0.6 : 1 }}>
                  <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 16, color: p.score >= 8 ? "var(--ix-brand)" : "var(--ix-text-muted)" }}>{p.score}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, color: "var(--ix-text-strong)" }}>{p.business_name}</div>
                    <div style={{ fontSize: 9, color: "var(--ix-text-subtle)", marginTop: 2, fontFamily: "monospace" }}>{p.slug}</div>
                    {p.campaign === "B" && <span style={{ fontSize: 9, fontWeight: 700, background: "#0443FB", color: "#fff", padding: "1px 5px", borderRadius: 3, marginTop: 3, display: "inline-block" }}>Campaign B</span>}
                  </td>
                  <td style={{ padding: "10px 12px", color: p.owner_name === "Unknown" ? "var(--ix-text-subtle)" : "var(--ix-text)" }}>
                    {p.owner_name === "Unknown" ? <span style={{ fontSize: 10 }}>needs research</span> : p.owner_name}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "var(--ix-text)" }}>{p.email || <span style={{ color: "var(--ix-text-subtle)", fontSize: 10 }}>—</span>}</div>
                    <div style={{ fontSize: 11, color: "var(--ix-text-muted)", marginTop: 1 }}>{p.phone || ""}</div>
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--ix-text-muted)", whiteSpace: "nowrap" }}>{p.industry}</td>
                  <td style={{ padding: "10px 12px" }}><AnglePill angle={p.outreach_angle} /></td>
                  <td style={{ padding: "10px 12px" }}><PriorityBadge p={p.priority} /></td>
                  <td style={{ padding: "10px 12px" }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, fontFamily: SANS,
                      background: p.screenshots_status === "captured" ? "#DCFCE7" : p.screenshots_status === "preview_not_built" ? "#F1F5F9" : "#FEF9C3",
                      color: p.screenshots_status === "captured" ? "#166534" : p.screenshots_status === "preview_not_built" ? "#475569" : "#854D0E",
                    }}>
                      {p.screenshots_status === "captured" ? "✓ captured" : p.screenshots_status === "preview_not_built" ? "preview needed" : "pending"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {p.preview_url
                      ? <a href={p.preview_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: "var(--wordmark-blue)", textDecoration: "none" }}>↗ view</a>
                      : <span style={{ fontSize: 10, color: "var(--ix-text-subtle)" }}>—</span>
                    }
                  </td>
                  <td style={{ padding: "10px 12px", maxWidth: 220 }}>
                    <span style={{ fontSize: 10, fontStyle: "italic", color: "var(--ix-text-muted)", lineHeight: 1.5, display: "block" }}>{p.subject_line}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GO / NO-GO */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 28 }}>
        <div style={{ background: "#F0FDF4", border: "2px solid #16A34A", borderRadius: 12, padding: "18px 22px" }}>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 800, color: "#16A34A", marginBottom: 12 }}>✓ GO — Wave #1 is ready</div>
          {["44 screenshots captured — all 11 active previews, 4 shots each", "6 P1 prospects with email confirmed", "Subject lines + opening lines written", "Outreach angles assigned per prospect", "Zoho CSV prepared — awaiting Gary import approval"].map(item => (
            <div key={item} style={{ fontFamily: SANS, fontSize: 11, color: "#166534", marginBottom: 6, display: "flex", gap: 8 }}>
              <span style={{ color: "#16A34A", fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
            </div>
          ))}
        </div>
        <div style={{ background: "#FFF7ED", border: "2px solid #F59E0B", borderRadius: 12, padding: "18px 22px" }}>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 800, color: "#B45309", marginBottom: 12 }}>→ Before launch</div>
          {["Gary approves screenshot selections", "Find emails for Nashville Painting, Construction Theory, Pressure Doctor", "Find contact info for At The Top Tree + AKAP Concrete", "Build 6 pending previews (P3 — lower priority)", "Gary GO/NO-GO to import CSV into Zoho"].map(item => (
            <div key={item} style={{ fontFamily: SANS, fontSize: 11, color: "#854D0E", marginBottom: 6, display: "flex", gap: 8 }}>
              <span style={{ color: "#F59E0B", fontWeight: 700, flexShrink: 0 }}>→</span>{item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Campaign B — Final Send ──────────────────────────────────────────

function CampaignBFinalSend() {
  const allReady = WSS_CAMPAIGN_B.every((p: WSSProspect) => p.status === "ready");
  const allScreenshots = WSS_CAMPAIGN_B.every((p: WSSProspect) => p.screenshots_status === "captured");

  return (
    <div>
      {/* Status strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Prospects", value: String(WSS_CAMPAIGN_B.length), sub: "All cleared", bg: "#DCFCE7", color: "#166534" },
          { label: "Emails verified", value: `${WSS_CAMPAIGN_B.filter((p: WSSProspect) => p.email).length}/6`, sub: "Source: preview footers", bg: "#DCFCE7", color: "#166534" },
          { label: "Previews live", value: `${WSS_CAMPAIGN_B.filter((p: WSSProspect) => p.preview_url).length}/6`, sub: "All verified 200 OK", bg: "#DCFCE7", color: "#166534" },
          { label: "Screenshots ready", value: `${WSS_CAMPAIGN_B.filter((p: WSSProspect) => p.screenshots_status === "captured").length}/6`, sub: "All captured", bg: "#DCFCE7", color: "#166534" },
          { label: "CTA", value: "contact", sub: "corristonconsulting.com/contact", bg: "#EFF6FF", color: "#1D4ED8" },
        ].map(({ label, value, sub, bg, color }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 800, color, lineHeight: 1, marginBottom: 2 }}>{value}</div>
            <div style={{ fontFamily: SANS, fontSize: 9, color, opacity: 0.7 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* GO banner */}
      <div style={{
        background: allReady && allScreenshots ? "#F0FDF4" : "#FFF7ED",
        border: `2px solid ${allReady && allScreenshots ? "#16A34A" : "#F59E0B"}`,
        borderRadius: 10, padding: "14px 20px", marginBottom: 28,
        fontFamily: SANS, display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: allReady && allScreenshots ? "#16A34A" : "#B45309" }}>
          {allReady && allScreenshots ? "✓ GO" : "→ PENDING"}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: allReady && allScreenshots ? "#166534" : "#92400E", marginBottom: 2 }}>
            {allReady && allScreenshots
              ? "Campaign B is ready. Gary approval required before any send."
              : "Waiting on screenshots or email confirmation."}
          </div>
          <div style={{ fontSize: 11, color: allReady && allScreenshots ? "#166534" : "#92400E", opacity: 0.8 }}>
            6 prospects · 6 emails confirmed · 6 previews live · 24 screenshots captured · CTA: corristonconsulting.com/contact · Nothing sent yet
          </div>
        </div>
      </div>

      {/* Subject lines table */}
      <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: "var(--ix-text-strong)", margin: "0 0 12px", letterSpacing: "-0.01em" }}>Final subject lines</h3>
      <div style={{ background: "var(--ix-surface)", border: "1px solid var(--ix-border)", borderRadius: 10, overflow: "hidden", marginBottom: 32 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--ix-surface-elevated)", borderBottom: "2px solid var(--ix-border)" }}>
              {["#", "Prospect", "To", "Subject line", "Angle", "Send status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ix-text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WSS_CAMPAIGN_B.map((p: WSSProspect, i: number) => (
              <tr key={p.slug} style={{ borderBottom: "1px solid var(--ix-border)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 800, color: "var(--ix-text-subtle)" }}>{i + 1}</td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: 700, color: "var(--ix-text-strong)" }}>{p.business_name}</div>
                  <div style={{ fontSize: 10, color: "var(--ix-text-subtle)", marginTop: 1 }}>{p.owner_name}</div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 11, color: "#166534", fontWeight: 600 }}>{p.email}</td>
                <td style={{ padding: "10px 12px", maxWidth: 260, fontSize: 11, fontStyle: "italic", color: "var(--ix-text-muted)" }}>
                  &ldquo;{p.subject_line}&rdquo;
                </td>
                <td style={{ padding: "10px 12px" }}><AnglePill angle={p.outreach_angle} /></td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, fontFamily: SANS, background: "#FEF9C3", color: "#854D0E" }}>
                    pending
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Full email cards */}
      <h3 style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: "var(--ix-text-strong)", margin: "0 0 16px", letterSpacing: "-0.01em" }}>Final email copy — all 6 prospects</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {WSS_CAMPAIGN_B.map((p: WSSProspect, i: number) => (
          <div key={p.slug} style={{ background: "var(--ix-surface)", border: "1px solid var(--ix-border)", borderRadius: 12, overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ background: "var(--ix-ink, #0B1220)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: SANS, fontSize: 11, color: "#64748B", fontWeight: 700 }}>#{i + 1}</span>
                <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 800, color: "#F1F5F9" }}>{p.business_name}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: "#16A34A", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, fontFamily: SANS }}>GO</span>
                <span style={{ background: "#0443FB", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, fontFamily: SANS }}>
                  {p.screenshots_status === "captured" ? "✓ screenshot" : "⚠ capture needed"}
                </span>
              </div>
            </div>

            {/* Meta + copy */}
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr" }}>
              {/* Meta */}
              <div style={{ padding: "16px 20px", borderRight: "1px solid var(--ix-border)" }}>
                {([
                  { label: "Owner", value: p.owner_name },
                  { label: "To", value: p.email ?? "—", highlight: true },
                  { label: "Phone", value: p.phone ?? "—" },
                  { label: "Website", value: p.website ?? "—" },
                  { label: "Preview", value: p.preview_url ? "↗ view" : "—", href: p.preview_url ?? undefined },
                  { label: "Shot", value: `${p.slug}/${p.primary_screenshot_type}.png`, mono: true },
                  { label: "CTA", value: "corristonconsulting.com/contact", href: p.cta_url ?? undefined },
                ] as { label: string; value: string; highlight?: boolean; href?: string; mono?: boolean }[]).map(({ label, value, highlight, href, mono }) => (
                  <div key={label} style={{ display: "flex", gap: 8, marginBottom: 7, fontFamily: SANS, fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: "var(--ix-text-muted)", minWidth: 60, flexShrink: 0 }}>{label}</span>
                    {href
                      ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#0443FB", textDecoration: "none", fontWeight: 600 }}>{value}</a>
                      : <span style={{ color: highlight ? "#166534" : mono ? "var(--ix-text-subtle)" : "var(--ix-text)", fontWeight: highlight ? 700 : 400, fontFamily: mono ? "monospace" : SANS, fontSize: mono ? 10 : 11, wordBreak: "break-all" }}>{value}</span>
                    }
                  </div>
                ))}
                {/* Thumbnail */}
                <div style={{ marginTop: 12 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/wss/screenshots/${p.slug}/${p.primary_screenshot_type}.png`}
                    alt={`${p.business_name} screenshot`}
                    onClick={() => window.open(`/wss/screenshots/${p.slug}/${p.primary_screenshot_type}.png`)}
                    style={{ width: "100%", height: 110, objectFit: "cover", objectPosition: "top", borderRadius: 6, border: "1px solid var(--ix-border)", cursor: "pointer" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              </div>

              {/* Copy */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ix-text-muted)", marginBottom: 5 }}>Subject</div>
                <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 800, color: "var(--ix-text-strong)", marginBottom: 14 }}>{p.subject_line}</div>
                <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ix-text-muted)", marginBottom: 6 }}>Body</div>
                <pre style={{ background: "var(--ix-surface-elevated)", borderRadius: 6, padding: "14px 16px", fontSize: 11, lineHeight: 1.75, color: "var(--ix-text)", whiteSpace: "pre-wrap", fontFamily: SANS, margin: 0 }}>
                  {p.email_copy}
                </pre>
                {/* All 4 screenshots */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ix-text-muted)", marginBottom: 8 }}>Screenshots</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {SHOT_TYPES.map(type => {
                      const isPrimary = p.primary_screenshot_type === type;
                      const src = `/wss/screenshots/${p.slug}/${type}.png`;
                      return (
                        <div key={type} style={{ border: isPrimary ? "2px solid var(--ix-brand)" : "1px solid var(--ix-border)", borderRadius: 6, overflow: "hidden" }}>
                          <div style={{ padding: "4px 8px", background: isPrimary ? "#EFF6FF" : "var(--ix-surface-elevated)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: isPrimary ? "var(--ix-brand)" : "var(--ix-text-muted)" }}>{type}</span>
                            {isPrimary && <span style={{ fontSize: 8, fontWeight: 700, background: "var(--ix-brand)", color: "#fff", padding: "1px 4px", borderRadius: 2 }}>★</span>}
                          </div>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={type} onClick={() => window.open(src)}
                            style={{ width: "100%", height: 70, objectFit: "cover", objectPosition: "top", display: "block", cursor: "pointer" }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Final GO/NO-GO */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 32 }}>
        <div style={{ background: "#F0FDF4", border: "2px solid #16A34A", borderRadius: 12, padding: "18px 22px" }}>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 800, color: "#16A34A", marginBottom: 12 }}>✓ GO — Campaign B</div>
          {["6 prospects — all contacts confirmed", "6 preview sites live + verified", "24 screenshots captured (6 × 4 types)", "Email copy written per prospect", "CTA: corristonconsulting.com/contact — no phone number", "Nothing sent. Nothing in Zoho yet."].map(item => (
            <div key={item} style={{ fontFamily: SANS, fontSize: 11, color: "#166534", marginBottom: 6, display: "flex", gap: 8 }}>
              <span style={{ color: "#16A34A", fontWeight: 700, flexShrink: 0 }}>✓</span>{item}
            </div>
          ))}
        </div>
        <div style={{ background: "#FFF7ED", border: "2px solid #F59E0B", borderRadius: 12, padding: "18px 22px" }}>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 800, color: "#B45309", marginBottom: 12 }}>→ Before launch</div>
          {["Gary reviews screenshots above", "Gary approves subject lines", "Gary GO/NO-GO to import Zoho CSV", "Gary GO/NO-GO to send Campaign B"].map(item => (
            <div key={item} style={{ fontFamily: SANS, fontSize: 11, color: "#854D0E", marginBottom: 6, display: "flex", gap: 8 }}>
              <span style={{ color: "#F59E0B", fontWeight: 700, flexShrink: 0 }}>→</span>{item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page shell with tabs ─────────────────────────────────────────────────────

type Tab = "screenshots" | "tracker" | "campaign-b";

export default function WSSMarketingPage() {
  const [tab, setTab] = useState<Tab>("campaign-b");

  const tabs: { key: Tab; label: string; count: number; accent?: boolean }[] = [
    { key: "campaign-b",  label: "campaign_b — final send", count: WSS_CAMPAIGN_B.length, accent: true },
    { key: "screenshots", label: "screenshot_review",        count: WSS_LIVE_PROSPECTS.length },
    { key: "tracker",     label: "outreach_tracker",         count: WSS_PROSPECTS.length },
  ];

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Link href="/admin/wss" style={{ fontFamily: SANS, fontSize: 12, color: "var(--ix-text-subtle)", textDecoration: "none" }}>wss</Link>
          <span style={{ color: "var(--ix-text-subtle)" }}>/</span>
          <span style={{ fontFamily: SANS, fontSize: 12, color: "var(--ix-text-muted)", fontWeight: 700 }}>marketing</span>
        </div>
        <h1 style={{ fontFamily: SANS, fontSize: 22, fontWeight: 800, color: "var(--ix-text-strong)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
          wss_marketing
        </h1>
        <p style={{ fontFamily: SANS, fontSize: 13, color: "var(--ix-text-muted)", margin: 0 }}>
          Campaign B — 6 prospects ready. Nothing sent. Nothing deployed. Gary approval required.
        </p>
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 28, borderBottom: "1px solid var(--ix-border)" }}>
        {tabs.map(({ key, label, count, accent }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              fontFamily: SANS,
              fontSize: 13,
              fontWeight: 700,
              padding: "9px 18px",
              border: "none",
              borderBottom: tab === key ? `2px solid ${accent ? "#0443FB" : "var(--ix-brand)"}` : "2px solid transparent",
              background: "transparent",
              color: tab === key ? (accent ? "#0443FB" : "var(--ix-brand)") : "var(--ix-text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: -1,
            }}
          >
            {label}
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              background: tab === key ? (accent ? "#0443FB" : "var(--ix-brand)") : "var(--ix-surface-elevated)",
              color: tab === key ? "#fff" : "var(--ix-text-subtle)",
              padding: "2px 7px",
              borderRadius: 20,
            }}>{count}</span>
          </button>
        ))}
      </div>

      {tab === "campaign-b" ? <CampaignBFinalSend /> : tab === "screenshots" ? <ScreenshotReview /> : <OutreachTracker />}
    </>
  );
}
