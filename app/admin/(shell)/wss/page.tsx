import Link from "next/link";
import { MonoLabel, WorkspaceHeader, MetricPanel } from "@/components/admin/ui/primitives";
import { WSS_PROSPECTS, WSS_LIVE_PROSPECTS, WSS_READY, WSS_P1, WSS_CAMPAIGN_B } from "@/lib/wss-prospects";

const SANS = "var(--font-jetbrains-mono), monospace";

const SHOT_TYPES = ["homepage", "hero", "mobile", "portal"] as const;

export default function WSSPage() {
  const totalProspects = WSS_PROSPECTS.length;
  const liveCount = WSS_LIVE_PROSPECTS.length;
  const readyCount = WSS_READY.length;
  const p1Count = WSS_P1.length;
  const screenshotCount = liveCount * 4;
  const campaignBCount = WSS_CAMPAIGN_B.length;

  return (
    <>
      <WorkspaceHeader
        name="website support studio"
        subtitle="Productized managed website support for local home service businesses. Asset-led outbound — build the preview, show the proof, close the client."
      />

      <div style={{ marginTop: "1.75rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
        <MetricPanel title="Total prospects" value={String(totalProspects)} hint={`${liveCount} live previews, ${totalProspects - liveCount} pending`} tone="default" />
        <MetricPanel title="Screenshots captured" value={String(screenshotCount)} hint={`${liveCount} prospects × 4 types — all verified on disk`} tone="sync" />
        <MetricPanel title="Ready to send" value={String(readyCount)} hint="Email + contact info confirmed" tone="ai" />
        <MetricPanel title="Wave #1 — P1" value={String(p1Count)} hint="Highest priority prospects for first outreach wave" tone="ai" />
        <MetricPanel title="Campaign B" value={String(campaignBCount)} hint="Final send — awaiting Gary GO/NO-GO" tone="ai" />
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: "1.75rem", display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { href: "/admin/wss/marketing", label: "marketing →" },
        ].map(({ href, label }) => (
          <Link key={href} href={href} style={{
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 700,
            color: "var(--wordmark-blue)",
            textDecoration: "none",
            border: "1px solid var(--wordmark-blue)",
            borderRadius: 6,
            padding: "7px 14px",
          }}>
            <MonoLabel text={label} />
          </Link>
        ))}
        <a href="https://previews.websitesupportstudio.com" target="_blank" rel="noopener noreferrer" style={{
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ix-text-muted)",
          textDecoration: "none",
          border: "1px solid var(--ix-border)",
          borderRadius: 6,
          padding: "7px 14px",
        }}>
          <MonoLabel text="preview host ↗" />
        </a>
      </div>

      {/* Wave #1 prospect table */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 700, color: "var(--ix-text-strong)", margin: "0 0 14px", letterSpacing: "-0.01em" }}>
          <MonoLabel text="wave #1 prospects" />
        </h2>
        <div style={{ background: "var(--ix-surface)", border: "1px solid var(--ix-border)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: SANS, fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--ix-surface-elevated)", borderBottom: "2px solid var(--ix-border)" }}>
                {["#", "Business", "Industry", "Angle", "Priority", "Status", "Screenshots", "Preview"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ix-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WSS_LIVE_PROSPECTS.map((p, i) => (
                <tr key={p.slug} style={{ borderBottom: "1px solid var(--ix-border)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: "var(--ix-text-subtle)", fontSize: 11 }}>#{i + 1}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, color: "var(--ix-text-strong)" }}>{p.business_name}</div>
                    {p.email && <div style={{ fontSize: 10, color: "var(--ix-text-subtle)", marginTop: 2 }}>{p.email}</div>}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--ix-text-muted)" }}>{p.industry}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <AngleBadge angle={p.outreach_angle} />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <PriorityBadge priority={p.priority} />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                      {SHOT_TYPES.map(t => (
                        <span key={t} style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: p.primary_screenshot_type === t ? "var(--ix-brand)" : "var(--ix-surface-elevated)",
                          color: p.primary_screenshot_type === t ? "#fff" : "var(--ix-text-subtle)",
                          border: `1px solid ${p.primary_screenshot_type === t ? "var(--ix-brand)" : "var(--ix-border)"}`,
                        }}>{t}</span>
                      ))}
                    </span>
                  </td>
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
    </>
  );
}

function AngleBadge({ angle }: { angle: string }) {
  const map: Record<string, { bg: string; color: string; short: string }> = {
    "A - Proof First":               { bg: "#FFF7ED", color: "#C2410C", short: "A — proof" },
    "B - Screenshot First":          { bg: "#EFF6FF", color: "#1D4ED8", short: "B — screenshot" },
    "C - Customer Experience First": { bg: "#F0FDF4", color: "#15803D", short: "C — cx" },
    "D - Marketing Quality First":   { bg: "#FAF5FF", color: "#7E22CE", short: "D — quality" },
  };
  const s = map[angle] ?? { bg: "var(--ix-surface-elevated)", color: "var(--ix-text-muted)", short: angle };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono), monospace", whiteSpace: "nowrap" }}>
      {s.short}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    P1: { bg: "#DCFCE7", color: "#166534" },
    P2: { bg: "#FEF9C3", color: "#854D0E" },
    P3: { bg: "#F1F5F9", color: "#475569" },
  };
  const s = map[priority] ?? { bg: "var(--ix-surface-elevated)", color: "var(--ix-text-muted)" };
  return <span style={{ ...s, padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: "var(--font-jetbrains-mono), monospace" }}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const isReady = status === "ready";
  return (
    <span style={{
      background: isReady ? "#DCFCE7" : "#FEF9C3",
      color: isReady ? "#166534" : "#854D0E",
      padding: "3px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      fontFamily: "var(--font-jetbrains-mono), monospace",
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}
