/**
 * Request categorization — support vs. product feedback (and feedback sub-type).
 *
 * KNOWN LIMITATION (documented risk): the backend does NOT yet have a structured category column on
 * `tickets`. Today, product feedback is encoded ENTIRELY in the ticket title prefix written by
 * src/data/customerRequests.ts#submitCustomerFeedback ("Product feedback: <Category> - <subject>").
 * That means categorization is string-parsing, and a customer who literally titles a real support
 * request "Product feedback: ..." would be miscounted. It is safe (read-only, no privilege change)
 * but fragile.
 *
 * SAFER FAST-FOLLOW (requires a migration → apply only in a coordinated DB window, NOT tonight):
 *   ALTER TABLE public.tickets ADD COLUMN request_kind text
 *     CHECK (request_kind IN ('support','product_feedback','bug_report','feature_request'));
 *   and add p_kind to submit_customer_request / a submit_customer_feedback RPC.
 * Until then, this module is the single place the READ side parses kind, so the magic string lives
 * in exactly one spot on the read path.
 */

/** Title prefix the feedback submit path writes. Must match customerRequests.ts exactly. */
export const PRODUCT_FEEDBACK_TITLE_PREFIX = "Product feedback:";

export type RequestKind = "support" | "product_feedback";

/** Finer feedback sub-type, parsed from the "<Category>" segment when present. */
export type FeedbackCategory = "feedback" | "feature_request" | "bug_report" | "other";

const FEEDBACK_LABEL_TO_CATEGORY: Record<string, FeedbackCategory> = {
  feedback: "feedback",
  "feature request": "feature_request",
  "bug report": "bug_report",
  other: "other",
};

/** Coarse kind: is this ticket product feedback or a support request? */
export function parseRequestKind(title: string | null | undefined): RequestKind {
  if (!title) return "support";
  return title.trimStart().startsWith(PRODUCT_FEEDBACK_TITLE_PREFIX) ? "product_feedback" : "support";
}

/** Fine feedback sub-type. Returns null when the ticket is not product feedback. */
export function parseFeedbackCategory(title: string | null | undefined): FeedbackCategory | null {
  if (parseRequestKind(title) !== "product_feedback") return null;
  const after = (title ?? "").trimStart().slice(PRODUCT_FEEDBACK_TITLE_PREFIX.length).trim();
  // Format is "<Category> - <subject>" or just "<Category>".
  const label = after.split(" - ")[0]?.trim().toLowerCase() ?? "";
  return FEEDBACK_LABEL_TO_CATEGORY[label] ?? "other";
}

/**
 * PostgREST `or` filter strings for counting by kind under RLS (read-only).
 * Used by the account assembler so support/feedback counts come from one definition.
 */
export const FEEDBACK_TITLE_LIKE = `${PRODUCT_FEEDBACK_TITLE_PREFIX}%`;
