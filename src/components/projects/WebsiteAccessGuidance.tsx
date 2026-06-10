/**
 * Website access guidance — presentational, platform-keyed copy (Website Project MVP, Phase 7).
 *
 * Shared by the read-only customer project panel and the operator project detail so both surfaces show
 * the same instructions. NO credentials are ever collected or stored — the copy only explains how to
 * add website_support_studio as a user/collaborator. Wix is an intentional "coming next" placeholder.
 */
import {
  ACCESS_STATUS_FLOW,
  accessStatusLabel,
  getAccessGuidance,
  type WebsiteAccessStatus,
} from "../../data/websiteAccess";

interface WebsiteAccessGuidanceProps {
  platform: string | null | undefined;
  accessStatus: string;
}

function statusTone(status: string): string {
  if (status === "verified") {
    return "is-verified";
  }
  if (status === "blocked") {
    return "is-blocked";
  }
  if (status === "access_received") {
    return "is-received";
  }
  return "is-pending";
}

export function WebsiteAccessGuidance({ platform, accessStatus }: WebsiteAccessGuidanceProps) {
  const guidance = getAccessGuidance(platform);
  const flowIndex = ACCESS_STATUS_FLOW.indexOf(accessStatus as WebsiteAccessStatus);
  const isResolved = accessStatus === "verified";

  return (
    <div className="wss-access">
      <div className="wss-access__head">
        <strong>{guidance.headline}</strong>
        <span className={`wss-access__chip ${statusTone(accessStatus)}`}>
          {accessStatusLabel(accessStatus)}
        </span>
      </div>

      {!guidance.comingSoon ? (
        <ol className="wss-access__flow" aria-label="access progress">
          {ACCESS_STATUS_FLOW.map((step, index) => (
            <li
              key={step}
              className={
                index < flowIndex || isResolved
                  ? "is-done"
                  : index === flowIndex
                    ? "is-current"
                    : "is-todo"
              }
            >
              {accessStatusLabel(step)}
            </li>
          ))}
        </ol>
      ) : null}

      {isResolved ? (
        <p className="wss-access__note">Access is verified — no action needed from you here.</p>
      ) : (
        <ul className="wss-access__steps">
          {guidance.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      )}

      {!isResolved && guidance.recommended.length > 0 ? (
        <ul className="wss-access__recommended">
          {guidance.recommended.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      <p className="wss-access__safety">{guidance.safety}</p>
    </div>
  );
}
