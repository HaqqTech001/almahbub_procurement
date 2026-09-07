import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  RequestHub,
  type ProcurementRequestRecord,
  type RequestHubRow,
} from "@hamd/ui/procurement";

import {
  listProcurementRequests,
  requireProcurementToken,
} from "../api/procurement-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";

function toHubRow(row: ProcurementRequestRecord): RequestHubRow {
  return {
    id: row.id,
    publicCode: row.publicCode,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    organizationName: row.organizationName,
    requesterName: row.requesterName,
    requesterEmail: row.requesterEmail,
    categoryLabel: row.items[0]?.description?.slice(0, 80) ?? null,
    lob: row.lob,
    priority: row.priority,
    assigneeName: row.assigneeName,
    related: row.related ?? null,
  };
}

export function RequestsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<ProcurementRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedFlash, setCopiedFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = params.get("q") ?? "";
  const status = params.get("status") ?? "all";
  const lob = params.get("lob") ?? "all";
  const priority = params.get("priority") ?? "all";

  const refresh = useCallback(async () => {
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      setRows(
        await listProcurementRequests(token, {
          pageSize: 100,
          q: query.trim() || undefined,
          status: status === "all" ? undefined : status,
          lob:
            lob === "international" || lob === "integrated_export"
              ? lob
              : undefined,
          priority: priority === "all" ? undefined : priority,
        }),
      );
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't load procurement requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, query, status, lob, priority]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hubRows = useMemo(() => rows.map(toHubRow), [rows]);

  return (
    <OpsPage className="hamd-ops-procurement hamd-ops-procurement--queue hamd-list-queue">
      {copiedFlash ? <OpsStatus tone="success">{copiedFlash}</OpsStatus> : null}
      {error ? (
        <OpsAlert>
          {error}{" "}
          <button type="button" className="hamd-btn hamd-btn--ghost" onClick={() => void refresh()}>
            Try Again
          </button>
        </OpsAlert>
      ) : null}
      <RequestHub
        audience="admin"
        title="Request queue"
        description="Process, filter, and open authorised organisation requests. This is not the buyer tracker."
        rows={hubRows}
        loading={loading}
        empty="No procurement requests match these filters."
        onOpen={(row) => navigate(`/requests/${row.id}`)}
        onRequestIdCopied={() => {
          setCopiedFlash("Request ID copied.");
          window.setTimeout(() => setCopiedFlash(null), 2500);
        }}
        toolbar={
          <div className="hamd-request-hub__toolbar" role="search">
            <label className="hamd-request-hub__field hamd-request-hub__field--search">
              <span className="hamd-request-hub__field-label">Search</span>
              <span className="hamd-request-hub__field-control">
                <span className="hamd-request-hub__field-icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  value={query}
                  onChange={(event) => {
                    const next = new URLSearchParams(params);
                    if (event.target.value) next.set("q", event.target.value);
                    else next.delete("q");
                    setParams(next);
                  }}
                  placeholder="Public code, title"
                />
              </span>
            </label>
            <label className="hamd-request-hub__field hamd-request-hub__field--status">
              <span className="hamd-request-hub__field-label">Status</span>
              <span className="hamd-request-hub__field-control">
                <select
                  value={status}
                  onChange={(event) => {
                    const next = new URLSearchParams(params);
                    if (event.target.value === "all") next.delete("status");
                    else next.set("status", event.target.value);
                    setParams(next);
                  }}
                >
                  <option value="all">All</option>
                  <option value="submitted">Submitted</option>
                  <option value="needs_clarification">Needs clarification</option>
                  <option value="accepted_for_sourcing">Accepted for sourcing</option>
                  <option value="sourcing">Sourcing</option>
                  <option value="quote_issued">Quoted</option>
                  <option value="revision_requested">Revision requested</option>
                  <option value="purchase_in_progress">Fulfilment</option>
                  <option value="fulfilled">Fulfilled</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </span>
            </label>
            <label className="hamd-request-hub__field hamd-request-hub__field--status">
              <span className="hamd-request-hub__field-label">Line of business</span>
              <span className="hamd-request-hub__field-control">
                <select
                  value={lob}
                  onChange={(event) => {
                    const next = new URLSearchParams(params);
                    if (event.target.value === "all") next.delete("lob");
                    else next.set("lob", event.target.value);
                    setParams(next);
                  }}
                >
                  <option value="all">All LOBs</option>
                  <option value="international">International</option>
                  <option value="integrated_export">Integrated Export</option>
                </select>
              </span>
            </label>
            <label className="hamd-request-hub__field hamd-request-hub__field--status">
              <span className="hamd-request-hub__field-label">Priority</span>
              <span className="hamd-request-hub__field-control">
                <select
                  value={priority}
                  onChange={(event) => {
                    const next = new URLSearchParams(params);
                    if (event.target.value === "all") next.delete("priority");
                    else next.set("priority", event.target.value);
                    setParams(next);
                  }}
                >
                  <option value="all">All</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </span>
            </label>
          </div>
        }
      />
    </OpsPage>
  );
}
