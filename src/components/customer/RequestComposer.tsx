import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";

import { MonoLabel } from "../brand/MonoLabel";
import {
  removeRequestAttachment,
  submitCustomerRequestWithAttachments,
  uploadRequestAttachment,
  type CustomerRequestAttachmentDraft,
  type CustomerRequestRecord,
} from "../../data/customerRequests";
import type { CustomerSite } from "../../data/customerWorkspace";

type RequestPriority = "low" | "normal" | "high" | "critical";
type AttachmentState = CustomerRequestAttachmentDraft & {
  id: string;
  status: "uploading" | "ready" | "error";
  previewUrl: string | null;
  error: string | null;
};

const PRIORITY_OPTIONS: RequestPriority[] = ["low", "normal", "high", "critical"];
const ACCEPT_ATTR = ".png,.jpg,.jpeg,.pdf,.doc,.docx,.csv,.txt,.zip,image/png,image/jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain,application/zip,application/x-zip-compressed";

function getRandomId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function getAttachmentLabel(mimeType: string): string {
  if (mimeType === "application/pdf") {
    return "pdf";
  }
  if (mimeType.includes("word")) {
    return "doc";
  }
  if (mimeType === "text/csv") {
    return "csv";
  }
  if (mimeType === "text/plain") {
    return "txt";
  }
  if (mimeType.includes("zip")) {
    return "zip";
  }
  return mimeType.split("/").at(-1) ?? "file";
}

export function RequestComposer({
  sites,
  onCreated,
}: {
  sites: CustomerSite[];
  onCreated: (request: CustomerRequestRecord) => void;
}) {
  const [open, setOpen] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<RequestPriority>("normal");
  const [attachments, setAttachments] = useState<AttachmentState[]>([]);
  const [draftId, setDraftId] = useState(() => getRandomId());
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open && sites.length > 0 && !siteId) {
      setSiteId(sites[0].id);
    }
  }, [open, sites, siteId]);

  useEffect(() => {
    if (!open) {
      for (const attachment of attachments) {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      }
      setSiteId(sites[0]?.id ?? "");
      setTitle("");
      setDescription("");
      setPriority("normal");
      setAttachments([]);
      setDraftId(getRandomId());
      setDragActive(false);
      setSubmitting(false);
      setError(null);
    }
  }, [open, sites, attachments]);

  const selectedSite = useMemo(() => sites.find((site) => site.id === siteId) ?? null, [siteId, sites]);

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) {
      return;
    }

    setError(null);
    for (const file of files) {
      const attachmentId = getRandomId();
      const previewUrl = isImage(file.type) ? URL.createObjectURL(file) : null;
      const local: AttachmentState = {
        id: attachmentId,
        storagePath: "",
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
        publicUrl: "",
        status: "uploading",
        previewUrl,
        error: null,
      };
      setAttachments((current) => [...current, local]);
      try {
        const uploaded = await uploadRequestAttachment(file, draftId);
        setAttachments((current) =>
          current.map((item) =>
            item.id === attachmentId
              ? {
                  ...item,
                  ...uploaded,
                  status: "ready",
                  error: null,
                }
              : item,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "attachment_upload_failed";
        setAttachments((current) =>
          current.map((item) =>
            item.id === attachmentId
              ? {
                  ...item,
                  status: "error",
                  error: message === "unsupported_attachment_type" ? "unsupported file type" : message,
                }
              : item,
          ),
        );
      }
    }
  }

  function removeAttachment(attachmentId: string) {
    setAttachments((current) => {
      const attachment = current.find((item) => item.id === attachmentId);
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      if (attachment?.status === "ready" && attachment.storagePath) {
        void removeRequestAttachment(attachment.storagePath);
      }
      return current.filter((item) => item.id !== attachmentId);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!siteId) {
      setError("choose a website before submitting.");
      return;
    }
    if (!title.trim()) {
      setError("add a short title.");
      return;
    }
    if (attachments.some((item) => item.status === "uploading")) {
      setError("wait for the files to finish uploading.");
      return;
    }

    const readyAttachments = attachments.filter((item) => item.status === "ready" && item.storagePath.length > 0);
    setSubmitting(true);
    setError(null);

    try {
      const result = await submitCustomerRequestWithAttachments({
        siteId,
        title: title.trim(),
        description: description.trim(),
        priority,
        attachments: readyAttachments.map((item) => ({
          storagePath: item.storagePath,
          fileName: item.fileName,
          mimeType: item.mimeType,
          fileSizeBytes: item.fileSizeBytes,
        })),
      });

      onCreated({
        ticketId: result.ticket_id,
        ticketNumber: result.ticket_number,
        title: title.trim(),
        status: result.status,
        priority,
        siteId,
        siteName: selectedSite?.name ?? "Unknown site",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: readyAttachments.map((item) => ({
          id: item.id,
          storagePath: item.storagePath,
          fileName: item.fileName,
          mimeType: item.mimeType,
          fileSizeBytes: item.fileSizeBytes,
          publicUrl: item.publicUrl,
          createdAt: new Date().toISOString(),
        })),
      });

      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "submit_failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="customer-new-request-launcher"
        onClick={() => setOpen(true)}
        aria-label="new request"
      >
        <span className="customer-new-request-launcher-label">
          <MonoLabel text="_new request" />
        </span>
        <span className="customer-new-request-launcher-short">_new_request</span>
      </button>

      {open ? (
        <div className="customer-request-modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="customer-request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-request-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="customer-request-modal-head">
              <div>
                <p className="customer-kicker">website_support_studio</p>
                <h2 id="customer-request-title">new_request</h2>
                <p className="customer-smallprint">Screenshots and files are first-class here.</p>
              </div>
              <button type="button" className="customer-request-close" onClick={() => setOpen(false)} aria-label="close">
                ×
              </button>
            </div>

            <form className="customer-request-form" onSubmit={handleSubmit}>
              <div className="customer-request-grid">
                <label className="auth-field">
                  <span className="auth-label">website / site *</span>
                  {sites.length === 0 ? (
                    <span className="auth-meta">No website is linked yet. Finish onboarding first.</span>
                  ) : (
                    <select className="auth-input" value={siteId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value)}>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>
                          {site.name}
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="auth-field">
                  <span className="auth-label">priority</span>
                  <select className="auth-input" value={priority} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value as RequestPriority)}>
                    {PRIORITY_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="auth-field">
                <span className="auth-label">title *</span>
                <input
                  className="auth-input"
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="Short summary of the issue"
                  required
                />
              </label>

              <label className="auth-field">
                <span className="auth-label">description</span>
                <textarea
                  className="auth-input"
                  rows={4}
                  value={description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="What happened, where, and what should change?"
                />
              </label>

              <div
                className={dragActive ? "customer-request-dropzone is-active" : "customer-request-dropzone"}
                onDragOver={(event: DragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(event: DragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  setDragActive(false);
                  void addFiles(event.dataTransfer.files);
                }}
              >
                <div>
                  <strong>attachments</strong>
                  <p>png, jpg, jpeg, pdf, doc, docx, csv, txt, zip</p>
                </div>
                <label className="customer-request-upload">
                  <input
                    type="file"
                    multiple
                    accept={ACCEPT_ATTR}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      if (event.target.files) {
                        void addFiles(event.target.files);
                      }
                      event.target.value = "";
                    }}
                  />
                  attach files
                </label>
              </div>

              {attachments.length > 0 ? (
                <div className="customer-request-attachments">
                  {attachments.map((attachment) => (
                    <article key={attachment.id} className="customer-request-attachment-card">
                      {isImage(attachment.mimeType) && attachment.publicUrl ? (
                        <img src={attachment.publicUrl || attachment.previewUrl || ""} alt={attachment.fileName} className="customer-request-thumbnail" />
                      ) : (
                        <div className="customer-request-file-mark">{getAttachmentLabel(attachment.mimeType)}</div>
                      )}
                      <div className="customer-request-attachment-body">
                        <strong>{attachment.fileName}</strong>
                        <span>{formatBytes(attachment.fileSizeBytes)}</span>
                        <span>{attachment.status === "error" ? attachment.error : attachment.status}</span>
                        <div className="customer-request-attachment-actions">
                          {attachment.status === "ready" && attachment.publicUrl ? (
                            <>
                              <a href={attachment.publicUrl} target="_blank" rel="noreferrer">open</a>
                              <a href={attachment.publicUrl} download={attachment.fileName}>download</a>
                            </>
                          ) : null}
                          <button type="button" onClick={() => removeAttachment(attachment.id)}>
                            remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {error ? <p className="customer-request-error" role="alert">{error}</p> : null}

              <div className="customer-request-actions">
                <button type="button" className="auth-btn auth-btn-ghost" onClick={() => setOpen(false)}>
                  cancel
                </button>
                <button className="auth-btn auth-btn-green" type="submit" disabled={submitting || sites.length === 0}>
                  {submitting ? "submitting…" : "submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
