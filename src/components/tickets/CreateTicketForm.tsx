import { useEffect, useMemo, useState, type FormEvent } from "react";

import { MonoLabel } from "../brand/MonoLabel";
import { ActorRole, TicketPriority, type TicketPriority as TicketPriorityType } from "../../domain/ticketStatus";
import { handleCreateTicket } from "../../handlers/ticketWorkflowHandlers";
import type { CreateTicketRequest } from "../../contracts/ticketWorkflowContracts";
import { type MockTicketQueueItem, ticketQueue } from "../../ui/mockData";

interface CreateTicketFormResult {
  ticketId: string;
  ticketNumber: string;
  status: string;
}

type TenantContext = {
  clientId: string;
  siteId: string;
  agencyId: string;
};

type SiteChoice = {
  id: string;
  name: string;
  clientId: string;
};

type TenantOptions = {
  clients: { id: string; name: string }[];
  sitesByClient: Map<string, SiteChoice[]>;
  defaultClientId: string;
  defaultSiteId: string;
};

function collectClientSiteOptions(queue: MockTicketQueueItem[]): TenantOptions {
  const clients = new Map<string, { id: string; name: string }>();
  const sitesByClient = new Map<string, Map<string, SiteChoice>>();

  for (const item of queue) {
    if (!clients.has(item.clientId)) {
      clients.set(item.clientId, { id: item.clientId, name: item.clientName });
    }

    const sites = sitesByClient.get(item.clientId) ?? new Map<string, SiteChoice>();
    if (!sites.has(item.siteId)) {
      sites.set(item.siteId, {
        id: item.siteId,
        name: item.siteName,
        clientId: item.clientId,
      });
    }

    sitesByClient.set(item.clientId, sites);
  }

  const clientsList = Array.from(clients.values());
  const firstClient = clientsList[0];
  const firstSite = firstClient
    ? (sitesByClient.get(firstClient.id)?.values().next().value as SiteChoice | undefined)
    : undefined;

  return {
    clients: clientsList,
    sitesByClient: new Map(Array.from(sitesByClient.entries()).map(([clientId, siteMap]) => [clientId, Array.from(siteMap.values())])),
    defaultClientId: firstClient?.id ?? "",
    defaultSiteId: firstSite?.id ?? "",
  };
}

function normalizeText(value: string): string {
  return value.trim();
}

export function CreateTicketForm() {
  const { clients, sitesByClient, defaultClientId, defaultSiteId } = useMemo(
    () => collectClientSiteOptions(ticketQueue),
    [],
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [priority, setPriority] = useState<TicketPriorityType>(TicketPriority.NORMAL);
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(defaultSiteId);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [createdTicket, setCreatedTicket] = useState<CreateTicketFormResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clients.length === 0) {
      return;
    }

    if (!selectedClientId || !clients.some((client) => client.id === selectedClientId)) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  const selectedSites = useMemo(
    () => sitesByClient.get(selectedClientId) ?? [],
    [selectedClientId, sitesByClient],
  );

  useEffect(() => {
    if (selectedSites.length === 0) {
      setSelectedSiteId("");
      return;
    }
    if (!selectedSiteId || !selectedSites.some((site) => site.id === selectedSiteId)) {
      setSelectedSiteId(selectedSites[0].id);
    }
  }, [selectedSites, selectedSiteId]);

  const tenantContextFromSelection = useMemo<TenantContext>(() => {
    const selectedClient = clients.find((client) => client.id === selectedClientId);
    const selectedSite = selectedSites.find((site) => site.id === selectedSiteId);
    if (!selectedClient || !selectedSite) {
      return {
        agencyId: "ag-local",
        clientId: "cli-local",
        siteId: "site-local",
      };
    }

    return {
      agencyId: `agency-${selectedClient.id}`,
      clientId: selectedClient.id,
      siteId: selectedSite.id,
    };
  }, [clients, selectedClientId, selectedSiteId, selectedSites]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSubmitterName("");
    setSubmitterEmail("");
    setPriority(TicketPriority.NORMAL);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCreatedTicket(null);

    const errors: Record<string, string> = {};
    if (!normalizeText(title)) {
      errors.title = "title is required";
    }
    if (!normalizeText(description)) {
      errors.description = "description is required";
    }
    if (!tenantContextFromSelection.clientId) {
      errors.clientId = "client is required";
    }
    if (!tenantContextFromSelection.siteId) {
      errors.siteId = "site is required";
    }
    if (!normalizeText(submitterEmail).includes("@")) {
      errors.submitterEmail = "valid submitter_email is required";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false);
      return;
    }

    setValidationErrors({});

    const request: CreateTicketRequest = {
      tenantContext: tenantContextFromSelection,
      actorContext: {
        actorRole: ActorRole.CS_AGENT,
        actorReference: "phase5b-ui-operator",
      },
      ticket: {
        rawMessage: description.trim(),
        intakeChannel: "operator_portal",
        source: "phase5b_create_form",
        title: title.trim(),
        priority,
        submitter: {
          submitterName: normalizeText(submitterName),
          submitterEmail: normalizeText(submitterEmail),
        },
      },
    };

    const result = handleCreateTicket(request);
    if (result.status === "error") {
      setErrorMessage(result.error);
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("ticket created successfully.");
    setCreatedTicket({
      ticketId: result.response.ticketId,
      ticketNumber: result.response.ticketNumber,
      status: result.response.status,
    });
    resetForm();
    setIsSubmitting(false);
  };

  return (
    <section className="phase5b-card">
      <h2>
        <MonoLabel text="support_request" />
      </h2>
      <p className="placeholder-meta">
        creates a new support request from customer input.
      </p>
      <p className="placeholder-meta">
        this form only creates the request. triage, replies, approvals, and closure happen elsewhere.
      </p>

      <form onSubmit={handleSubmit} className="phase5b-form" noValidate>
        <label>
          title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="short ticket title"
          />
          {validationErrors.title && <span className="phase5b-error">{validationErrors.title}</span>}
        </label>

        <label>
          description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="customer request description"
          />
          {validationErrors.description && <span className="phase5b-error">{validationErrors.description}</span>}
        </label>

        <label>
          client
          <select
            value={selectedClientId}
            onChange={(event) => {
              setSelectedClientId(event.target.value);
              setSelectedSiteId("");
            }}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.id})
              </option>
            ))}
          </select>
          {validationErrors.clientId && <span className="phase5b-error">{validationErrors.clientId}</span>}
        </label>

        <label>
          site
          <select
            value={selectedSiteId}
            onChange={(event) => setSelectedSiteId(event.target.value)}
            disabled={selectedSites.length === 0}
          >
            <option value="" disabled>
              {selectedSites.length === 0 ? "no site available" : "select site"}
            </option>
            {selectedSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.id})
              </option>
            ))}
          </select>
          {validationErrors.siteId && <span className="phase5b-error">{validationErrors.siteId}</span>}
        </label>

        <label>
          submitter_name
          <input
            value={submitterName}
            onChange={(event) => setSubmitterName(event.target.value)}
            placeholder="name"
          />
        </label>

        <label>
          submitter_email
          <input
            type="email"
            value={submitterEmail}
            onChange={(event) => setSubmitterEmail(event.target.value)}
            placeholder="customer@example.com"
          />
          {validationErrors.submitterEmail && <span className="phase5b-error">{validationErrors.submitterEmail}</span>}
        </label>

        <label>
          priority
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TicketPriorityType)}
          >
            {Object.values(TicketPriority).map((priorityOption) => (
              <option key={priorityOption} value={priorityOption}>
                {priorityOption}
              </option>
            ))}
          </select>
        </label>

        <div className="phase5b-actions">
          <button type="submit" disabled={isSubmitting} className="phase4a-action">
            {isSubmitting ? "creating_request..." : "create_support_request"}
          </button>
        </div>
      </form>

      {errorMessage && <p className="phase5b-error">failure: {errorMessage}</p>}
      {successMessage && createdTicket && (
        <p className="phase5b-success">
          success: {successMessage} ticket {createdTicket.ticketNumber} ({createdTicket.ticketId}), status{" "}
          {createdTicket.status}.
        </p>
      )}

      <p className="placeholder-meta">
        validation is local; only the create-request path is available here.
      </p>
      <p className="placeholder-meta">
        client/site are selected from local data for this operator view.
      </p>
      <pre className="phase5b-debug-note">
        Tenant context: {tenantContextFromSelection.agencyId} / {tenantContextFromSelection.clientId} / {tenantContextFromSelection.siteId}
      </pre>
    </section>
  );
}
