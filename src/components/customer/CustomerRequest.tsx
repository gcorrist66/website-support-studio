/**
 * Customer request submission — minimal post-onboarding form (NOT a dashboard).
 *
 * Shown to an onboarded customer. Fields: Title, Description, Site, Priority. Site options come
 * from the RLS-scoped org sites; no agency/client/site IDs or operator/internal fields are exposed.
 * Submits via the submit_customer_request RPC and shows a confirmation (ticket id + status).
 */
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { LogoLockup } from "../brand/LogoLockup";
import { useAuth } from "../../auth/AuthProvider";
import { listMySites, submitCustomerRequest, type SiteOption, type SubmitRequestResult } from "../../data/customerRequests";

const PRIORITIES = ["low", "normal", "high", "critical"] as const;

export function CustomerRequest() {
  const { signOut } = useAuth();
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [siteId, setSiteId] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitRequestResult | null>(null);

  useEffect(() => {
    let active = true;
    listMySites()
      .then((s) => {
        if (!active) return;
        setSites(s);
        if (s.length > 0) setSiteId(s[0].id);
        setLoadingSites(false);
      })
      .catch(() => {
        if (active) setLoadingSites(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!siteId) {
      setError("Please select a website.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await submitCustomerRequest({ siteId, title, description, priority });
      setResult(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setResult(null);
    setTitle("");
    setDescription("");
    setPriority("normal");
    setError(null);
  }

  if (result) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <LogoLockup size={30} />
          <h1 className="auth-title">request submitted</h1>
          <p className="auth-meta">Your request is in the queue and a human will review it.</p>
          <p className="auth-meta"><strong>Request ID:</strong> {result.ticket_number}</p>
          <p className="auth-meta"><strong>Status:</strong> {result.status}</p>
          <button className="auth-btn auth-btn-green" type="button" onClick={reset}>submit another request</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={onSubmit}>
        <LogoLockup size={30} />
        <h1 className="auth-title">new request</h1>
        <p className="auth-subtitle">tell us what you need on your website. every change is reviewed before it ships.</p>

        <label className="auth-field">
          <span className="auth-label">title *</span>
          <input className="auth-input" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
        </label>

        <label className="auth-field">
          <span className="auth-label">website *</span>
          {loadingSites ? (
            <span className="auth-meta">loading your websites…</span>
          ) : sites.length === 0 ? (
            <span className="auth-meta">no website on file yet — add one in onboarding first.</span>
          ) : (
            <select className="auth-input" value={siteId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSiteId(e.target.value)}>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </label>

        <label className="auth-field">
          <span className="auth-label">priority</span>
          <select className="auth-input" value={priority} onChange={(e: ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>

        <label className="auth-field">
          <span className="auth-label">description</span>
          <textarea
            className="auth-input"
            rows={5}
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="What would you like changed or fixed?"
          />
        </label>

        {error ? <p className="auth-error" role="alert">{error}</p> : null}

        <button className="auth-btn auth-btn-green" type="submit" disabled={submitting || sites.length === 0}>
          {submitting ? "submitting…" : "submit request"}
        </button>
        <button className="auth-btn auth-btn-ghost" type="button" onClick={() => { void signOut(); }}>sign out</button>
      </form>
    </div>
  );
}
