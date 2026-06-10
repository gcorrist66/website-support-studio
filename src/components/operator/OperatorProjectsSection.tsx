/**
 * Operator Projects — additive operator-console section (Website Project MVP, Phase 5).
 *
 * Operator-led project creation + tracking for the website-project customers. Every write goes through
 * the self-authorizing operator_* RPCs (operatorProjects.*). Reads are RLS-scoped to the operator's
 * agency. When no real operator session exists (auth flag off / dev), the section degrades to a notice
 * instead of failing — mirroring the existing operatorWorkflow.isLive() pattern.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  operatorProjects,
  type OperatorClientOption,
  type OperatorProject,
  type OperatorProjectDetail,
} from "../../data/operatorProjects";
import {
  ACCESS_STATUS_OPTIONS,
  accessStatusLabel,
  platformLabel,
  projectStatusLabel,
} from "../../data/websiteAccess";
import { WebsiteAccessGuidance } from "../projects/WebsiteAccessGuidance";

const PROJECT_TYPES = ["new_website", "rebuild", "fix", "update", "migration", "ongoing_ops", "other"];
const PLATFORMS = ["wordpress", "shopify", "wix", "other"];
const PROJECT_STATUSES = [
  "intake",
  "scoping",
  "in_progress",
  "waiting_on_customer",
  "in_review",
  "delivered",
  "closed",
  "blocked",
  "cancelled",
];
const MILESTONE_STATUSES = ["pending", "in_progress", "done", "skipped"];
const DELIVERABLE_STATUSES = ["pending", "delivered", "accepted"];
const DELIVERABLE_KINDS = ["link", "file", "note"]; // 'credential' intentionally excluded — no credential storage
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

function dollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") {
    return null;
  }
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return Math.round(parsed * 100);
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

// ---------------------------------------------------------------------------
// New project form
// ---------------------------------------------------------------------------
function NewProjectForm({
  clients,
  onCreated,
  onCancel,
}: {
  clients: OperatorClientOption[];
  onCreated: (projectId: string) => void;
  onCancel: () => void;
}) {
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState("new_website");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [platform, setPlatform] = useState("");
  const [price, setPrice] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [summary, setSummary] = useState("");
  const [intakeNotes, setIntakeNotes] = useState("");
  const [seedTemplate, setSeedTemplate] = useState(true);
  const [markPaid, setMarkPaid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!clientId) {
      setError("Choose a customer.");
      return;
    }
    if (title.trim() === "") {
      setError("Enter a project title.");
      return;
    }
    setBusy(true);
    try {
      const result = await operatorProjects.createProject({
        clientId,
        title: title.trim(),
        projectType,
        summary: summary.trim() || null,
        priceCents: dollarsToCents(price),
        intakeNotes: intakeNotes.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        platform: platform || null,
        targetDeliveryDate: targetDate || null,
      });
      const projectId = String(result.project_id ?? "");
      if (projectId && seedTemplate) {
        try {
          await operatorProjects.applyTemplate(projectId);
        } catch {
          // template seeding is best-effort; the operator can apply it from the detail view
        }
      }
      if (projectId && markPaid) {
        try {
          await operatorProjects.updateProject({ projectId, paymentStatus: "paid" });
        } catch {
          // non-fatal
        }
      }
      onCreated(projectId);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="wss-card wss-project-form" onSubmit={onSubmit}>
      <h3>New project</h3>
      {clients.length === 0 ? (
        <p className="wss-project-warn">No customers loaded — confirm you have an operator session in this agency.</p>
      ) : null}

      <label className="wss-field">
        <span>Customer</span>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="">Select a customer…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="wss-field">
        <span>Project title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New marketing website" />
      </label>

      <div className="wss-field-row">
        <label className="wss-field">
          <span>Type</span>
          <select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="wss-field">
          <span>Platform</span>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">Not set</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {platformLabel(p)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="wss-field">
        <span>Website URL</span>
        <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://example.com" />
      </label>

      <div className="wss-field-row">
        <label className="wss-field">
          <span>Price (USD)</span>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="500" inputMode="decimal" />
        </label>
        <label className="wss-field">
          <span>Target delivery</span>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </label>
      </div>

      <label className="wss-field">
        <span>Summary (customer-visible)</span>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} />
      </label>

      <label className="wss-field">
        <span>Intake notes (operator-only)</span>
        <textarea value={intakeNotes} onChange={(e) => setIntakeNotes(e.target.value)} rows={2} />
      </label>

      <label className="wss-check">
        <input type="checkbox" checked={seedTemplate} onChange={(e) => setSeedTemplate(e.target.checked)} />
        <span>Seed milestones from the {projectType.replaceAll("_", " ")} template</span>
      </label>
      <label className="wss-check">
        <input type="checkbox" checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)} />
        <span>Mark as paid (customer already purchased)</span>
      </label>

      {error ? <p className="wss-project-warn">{error}</p> : null}

      <div className="wss-field-row">
        <button type="submit" className="wss-primary-button" disabled={busy}>
          {busy ? "Creating…" : "Create project"}
        </button>
        <button type="button" className="wss-secondary-button" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Project detail
// ---------------------------------------------------------------------------
function ProjectDetailPanel({
  detail,
  onChanged,
  onBack,
}: {
  detail: OperatorProjectDetail;
  onChanged: () => void;
  onBack: () => void;
}) {
  const { project, milestones, deliverables } = detail;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState("");
  const [delTitle, setDelTitle] = useState("");
  const [delKind, setDelKind] = useState("link");
  const [delUrl, setDelUrl] = useState("");

  async function run(action: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage(ok);
      onChanged();
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wss-card wss-project-detail">
      <div className="wss-field-row wss-project-detail__head">
        <div>
          <p className="wss-card-kicker">{project.projectNumber}</p>
          <h3>{project.title}</h3>
          <p className="wss-project-detail__meta">
            {projectStatusLabel(project.status)} · {platformLabel(project.platform)} · payment: {project.paymentStatus}
          </p>
        </div>
        <button type="button" className="wss-secondary-button" onClick={onBack}>
          ← all projects
        </button>
      </div>

      {message ? <p className="wss-project-note">{message}</p> : null}

      <div className="wss-detail-controls">
        <label className="wss-field">
          <span>Delivery status</span>
          <select
            value={project.status}
            disabled={busy}
            onChange={(e) => run(() => operatorProjects.setStatus(project.id, e.target.value), "Status updated")}
          >
            {PROJECT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>

        <label className="wss-field">
          <span>Website access</span>
          <select
            value={project.accessStatus}
            disabled={busy}
            onChange={(e) => run(() => operatorProjects.setAccess(project.id, e.target.value), "Access updated")}
          >
            {ACCESS_STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {accessStatusLabel(st)}
              </option>
            ))}
          </select>
        </label>

        <label className="wss-field">
          <span>Payment</span>
          <select
            value={project.paymentStatus}
            disabled={busy}
            onChange={(e) =>
              run(() => operatorProjects.updateProject({ projectId: project.id, paymentStatus: e.target.value }), "Payment updated")
            }
          >
            {PAYMENT_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="wss-project-detail__section">
        <div className="wss-field-row wss-spread">
          <h4>Milestones</h4>
          {milestones.length === 0 ? (
            <button
              type="button"
              className="wss-secondary-button"
              disabled={busy}
              onClick={() => run(() => operatorProjects.applyTemplate(project.id), "Template applied")}
            >
              apply {project.projectType.replaceAll("_", " ")} template
            </button>
          ) : null}
        </div>
        {milestones.length === 0 ? (
          <p className="wss-card-note">No milestones yet — apply a template or add one below.</p>
        ) : (
          <ul className="wss-milestone-list">
            {milestones.map((m) => (
              <li key={m.id}>
                <span className={m.status === "done" ? "wss-ms-title is-done" : "wss-ms-title"}>{m.title}</span>
                <select
                  value={m.status}
                  disabled={busy}
                  onChange={(e) => run(() => operatorProjects.setMilestoneStatus(m.id, e.target.value), "Milestone updated")}
                >
                  {MILESTONE_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
        <div className="wss-field-row">
          <input
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            placeholder="Add a milestone…"
          />
          <button
            type="button"
            className="wss-secondary-button"
            disabled={busy || newMilestone.trim() === ""}
            onClick={() =>
              run(async () => {
                await operatorProjects.addMilestone(project.id, newMilestone.trim(), undefined, milestones.length + 1);
                setNewMilestone("");
              }, "Milestone added")
            }
          >
            add
          </button>
        </div>
      </div>

      <div className="wss-project-detail__section">
        <h4>Deliverables</h4>
        {deliverables.length === 0 ? (
          <p className="wss-card-note">No deliverables yet.</p>
        ) : (
          <ul className="wss-milestone-list">
            {deliverables.map((d) => (
              <li key={d.id}>
                <span className="wss-ms-title">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer">
                      {d.title}
                    </a>
                  ) : (
                    d.title
                  )}
                </span>
                <select
                  value={d.status}
                  disabled={busy}
                  onChange={(e) => run(() => operatorProjects.setDeliverableStatus(d.id, e.target.value), "Deliverable updated")}
                >
                  {DELIVERABLE_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        )}
        <div className="wss-field-row">
          <input value={delTitle} onChange={(e) => setDelTitle(e.target.value)} placeholder="Deliverable title…" />
          <select value={delKind} onChange={(e) => setDelKind(e.target.value)}>
            {DELIVERABLE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input value={delUrl} onChange={(e) => setDelUrl(e.target.value)} placeholder="https:// (optional)" />
          <button
            type="button"
            className="wss-secondary-button"
            disabled={busy || delTitle.trim() === ""}
            onClick={() =>
              run(async () => {
                await operatorProjects.addDeliverable(project.id, delTitle.trim(), delKind, delUrl.trim() || undefined);
                setDelTitle("");
                setDelUrl("");
              }, "Deliverable added")
            }
          >
            add
          </button>
        </div>
      </div>

      <div className="wss-project-detail__section">
        <h4>Access guidance (what the customer sees)</h4>
        <WebsiteAccessGuidance platform={project.platform} accessStatus={project.accessStatus} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section root
// ---------------------------------------------------------------------------
export function OperatorProjectsSection() {
  const live = operatorProjects.isLive();
  const [projects, setProjects] = useState<OperatorProject[]>([]);
  const [clients, setClients] = useState<OperatorClientOption[]>([]);
  const [detail, setDetail] = useState<OperatorProjectDetail | null>(null);
  const [mode, setMode] = useState<"list" | "new">("list");
  const [loading, setLoading] = useState(live);

  const reloadList = useCallback(async () => {
    const [proj, cli] = await Promise.all([operatorProjects.listProjects(), operatorProjects.listClients()]);
    setProjects(proj);
    setClients(cli);
  }, []);

  const openDetail = useCallback(async (projectId: string) => {
    const loaded = await operatorProjects.loadDetail(projectId);
    setDetail(loaded);
  }, []);

  useEffect(() => {
    if (!live) {
      return;
    }
    let active = true;
    setLoading(true);
    void reloadList().finally(() => {
      if (active) {
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [live, reloadList]);

  if (!live) {
    return (
      <section className="wss-panel">
        <h2>projects</h2>
        <p className="wss-card-note">
          Connect a real operator session (enable auth) to create and manage website projects. This section is
          additive and dev-only on <code>v2-foundation</code>.
        </p>
      </section>
    );
  }

  if (detail) {
    return (
      <section className="wss-panel">
        <ProjectDetailPanel
          detail={detail}
          onChanged={() => {
            void openDetail(detail.project.id);
            void reloadList();
          }}
          onBack={() => setDetail(null)}
        />
      </section>
    );
  }

  if (mode === "new") {
    return (
      <section className="wss-panel">
        <NewProjectForm
          clients={clients}
          onCancel={() => setMode("list")}
          onCreated={(projectId) => {
            setMode("list");
            void reloadList();
            if (projectId) {
              void openDetail(projectId);
            }
          }}
        />
      </section>
    );
  }

  return (
    <section className="wss-panel">
      <div className="wss-field-row wss-spread">
        <div>
          <h2>projects</h2>
          <p className="wss-card-note">Operator-led website projects for the two waiting customers.</p>
        </div>
        <button type="button" className="wss-primary-button" onClick={() => setMode("new")}>
          + new project
        </button>
      </div>

      {loading ? <p className="wss-card-note">Loading projects…</p> : null}
      {!loading && projects.length === 0 ? (
        <p className="wss-card-note">No projects yet. Create one for a customer who has purchased a website build.</p>
      ) : null}

      <div className="wss-project-grid">
        {projects.map((p) => (
          <button key={p.id} type="button" className="wss-project-tile" onClick={() => void openDetail(p.id)}>
            <span className="wss-card-kicker">{p.projectNumber}</span>
            <strong>{p.title}</strong>
            <span className="wss-project-tile__meta">
              {projectStatusLabel(p.status)} · {platformLabel(p.platform)}
            </span>
            <span className="wss-project-tile__meta">
              access: {accessStatusLabel(p.accessStatus)} · {p.paymentStatus}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
