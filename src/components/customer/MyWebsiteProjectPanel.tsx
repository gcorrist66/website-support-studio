/**
 * Customer "My Website Project" — read-only panel (Website Project MVP, Phase 6).
 *
 * Renders exactly what get_my_projects() returns: project identity, status + progress, website + platform,
 * target date, what-we-need-from-you, next milestone, completed milestones, delivered deliverables, linked
 * requests, and the guided website-access status. No writes, no operator-only fields.
 */
import type { CustomerProject } from "../../data/customerProjects";
import { platformLabel, projectStatusLabel } from "../../data/websiteAccess";
import { WebsiteAccessGuidance } from "../projects/WebsiteAccessGuidance";

function formatDate(iso: string | null): string {
  if (!iso) {
    return "Not scheduled";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function formatPrice(cents: number | null, currency: string): string {
  if (cents === null) {
    return "—";
  }
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(
      cents / 100,
    );
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

function ProjectCard({ project }: { project: CustomerProject }) {
  const { done, total } = project.milestoneProgress;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const completed = project.milestones.filter((m) => m.status === "done");

  return (
    <article className="wss-project">
      <header className="wss-project__head">
        <div>
          <p className="customer-kicker">{project.projectNumber}</p>
          <h3>{project.title}</h3>
        </div>
        <span className="wss-project__status">{projectStatusLabel(project.status)}</span>
      </header>

      {project.summary ? <p className="customer-copy">{project.summary}</p> : null}

      <div className="wss-project__progress" aria-label="milestone progress">
        <div className="wss-project__bar">
          <span style={{ width: `${pct}%` }} />
        </div>
        <small>
          {done} of {total} milestones complete{project.nextMilestone ? ` · Next: ${project.nextMilestone.title}` : ""}
        </small>
      </div>

      <dl className="customer-definition-list">
        <div>
          <dt>Website</dt>
          <dd>
            {project.websiteUrl ? (
              <a href={project.websiteUrl} target="_blank" rel="noreferrer">
                {project.websiteUrl}
              </a>
            ) : (
              "Not set yet"
            )}
          </dd>
        </div>
        <div>
          <dt>Platform</dt>
          <dd>{platformLabel(project.platform)}</dd>
        </div>
        <div>
          <dt>Target delivery</dt>
          <dd>{formatDate(project.targetDeliveryDate)}</dd>
        </div>
        <div>
          <dt>Investment</dt>
          <dd>{formatPrice(project.priceCents, project.currency)}</dd>
        </div>
      </dl>

      {project.needsFromYou.length > 0 ? (
        <div className="wss-project__needs">
          <h4>What we need from you</h4>
          <ul className="customer-bullet-list">
            {project.needsFromYou.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="customer-smallprint">Nothing needed from you right now — we'll reach out if that changes.</p>
      )}

      <div className="wss-project__section">
        <h4>Website access</h4>
        <WebsiteAccessGuidance platform={project.platform} accessStatus={project.accessStatus} />
      </div>

      {completed.length > 0 ? (
        <div className="wss-project__section">
          <h4>Completed milestones</h4>
          <ul className="wss-checklist">
            {completed.map((m) => (
              <li key={m.id} className="is-done">
                <span aria-hidden="true">✓</span> {m.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {project.deliverables.length > 0 ? (
        <div className="wss-project__section">
          <h4>Delivered</h4>
          <ul className="wss-deliverables">
            {project.deliverables.map((d) => (
              <li key={d.id}>
                {d.url ? (
                  <a href={d.url} target="_blank" rel="noreferrer">
                    {d.title}
                  </a>
                ) : (
                  d.title
                )}
                <small>{d.status}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {project.requests.length > 0 ? (
        <div className="wss-project__section">
          <h4>Linked requests</h4>
          <ul className="wss-deliverables">
            {project.requests.map((r) => (
              <li key={r.ticketNumber}>
                <span>
                  {r.ticketNumber} — {r.title}
                </span>
                <small>{r.status.replaceAll("_", " ")}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

interface MyWebsiteProjectPanelProps {
  projects: CustomerProject[];
  loading: boolean;
}

export function MyWebsiteProjectPanel({ projects, loading }: MyWebsiteProjectPanelProps) {
  if (loading) {
    return (
      <section className="customer-card customer-card-wide">
        <h2>Your website project</h2>
        <p className="customer-loading">Loading your project…</p>
      </section>
    );
  }

  if (projects.length === 0) {
    // Read-only MVP: most customers won't have a project. Don't clutter their dashboard with an empty card.
    return null;
  }

  return (
    <section className="customer-card customer-card-wide">
      <h2>Your website project</h2>
      <p className="customer-smallprint">
        Track your build here: where it stands, what's next, and what we need from you.
      </p>
      <div className="wss-project-list">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
