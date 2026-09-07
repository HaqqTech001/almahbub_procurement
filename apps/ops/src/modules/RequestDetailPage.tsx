import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createFetchGate,
  isCancelledRequest,
  runMutationThenRefresh,
  userFacingRequestError,
} from "@hamd/ui/auth";
import {
  RequestDetailView,
  adminQuotationCommands,
  adminRequestCommands,
  type ProcurementCommand,
  type ProcurementRequestRecord,
} from "@hamd/ui/procurement";

import {
  getProcurementRequest,
  ProcurementApiError,
  requireProcurementToken,
  transitionProcurementRequest,
} from "../api/procurement-api.js";
import {
  requireQuotationToken,
  transitionQuotation,
} from "../api/quotation-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { resolveOpsMediaUrl } from "./ProductsPage.js";

export function RequestDetailPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [row, setRow] = useState<ProcurementRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedFlash, setCopiedFlash] = useState<string | null>(null);
  const gate = useMemo(() => createFetchGate(), []);

  const refresh = useCallback(async (mode: "load" | "background" = "load") => {
    if (!id) return;
    const generation = gate.next();
    if (mode === "load") {
      setError(null);
      setRefreshWarning(null);
    }
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      const next = await getProcurementRequest(token, id);
      if (!gate.isCurrent(generation)) return;
      setRow(next);
      setError(null);
      setRefreshWarning(null);
    } catch (err) {
      if (!gate.isCurrent(generation)) return;
      if (isCancelledRequest(err)) return;
      const message =
        err instanceof ProcurementApiError
          ? err.message
          : "Unable to load this request.";
      if (mode === "background") {
        setRefreshWarning(userFacingRequestError(err, message));
        return;
      }
      setRow(null);
      setError(message);
    } finally {
      if (gate.isCurrent(generation)) setLoading(false);
    }
  }, [auth.ensureSession, gate, id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestCommands = useMemo(
    () => (row ? adminRequestCommands(row.status, auth.permissions) : []),
    [auth.permissions, row],
  );
  const quotationCommands = useMemo(
    () =>
      adminQuotationCommands(row?.related?.quotations?.[0]?.status, auth.permissions),
    [auth.permissions, row],
  );

  const runRequestCommand = async (
    command: ProcurementCommand,
    extra?: { reason?: string },
  ) => {
    if (!row || busy) return;
    const needsReason = [
      "request_clarification",
      "cancel",
      "decline",
      "request_revision",
    ].includes(command);
    const reasonText = extra?.reason?.trim() ?? "";
    if (needsReason && reasonText.length < 3) {
      setError(
        command === "request_clarification"
          ? "Write the exact information the buyer must provide."
          : "A reason of at least 3 characters is required.",
      );
      return;
    }
    setBusy(true);
    setError(null);
    setRefreshWarning(null);
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      const updated = await transitionProcurementRequest(token, row.id, command, {
        rowVersion: row.rowVersion,
        reason: extra?.reason?.trim(),
      });
      setRow(updated);
    } catch (err) {
      if (isCancelledRequest(err)) return;
      setError(
        err instanceof ProcurementApiError
          ? err.message
          : "Unable to update this request.",
      );
    } finally {
      setBusy(false);
    }
  };

  const runQuotationCommand = async (
    quotationId: string,
    command: "review" | "issue",
  ) => {
    if (!row || busy) return;
    const quoteRowVersion =
      row.related?.quotations?.find((item) => item.id === quotationId)?.rowVersion ?? 0;
    setBusy(true);
    setError(null);
    setRefreshWarning(null);
    try {
      const token = await requireQuotationToken(auth.ensureSession);
      const { refreshError } = await runMutationThenRefresh({
        mutate: () =>
          transitionQuotation(token, quotationId, command, {
            rowVersion: quoteRowVersion,
          }),
        refresh: () => refresh("background"),
      });
      if (refreshError) {
        setRefreshWarning(
          userFacingRequestError(
            refreshError,
            "Quotation updated. The latest request details could not be refreshed.",
          ),
        );
      }
    } catch (err) {
      if (isCancelledRequest(err)) return;
      setError(err instanceof Error ? err.message : "Unable to update quotation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OpsPage className="hamd-ops-procurement">
      <p>
        <Link to="/requests">← All requests</Link>
      </p>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {copiedFlash ? <OpsStatus tone="success">{copiedFlash}</OpsStatus> : null}
      {refreshWarning ? <OpsAlert>{refreshWarning}</OpsAlert> : null}
      {loading && !row ? <OpsLoading label="Loading request…" /> : null}
      {row ? (
        <RequestDetailView
          audience="admin"
          request={{
            id: row.id,
            publicCode: row.publicCode,
            title: row.title,
            status: row.status,
            notes: row.notes,
            destinationCountryCode: row.destinationCountryCode,
            destinationAddress: row.destinationAddress,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            requesterName: row.requesterName,
            requesterEmail: row.requesterEmail,
            organizationName: row.organizationName,
            lob: row.lob,
            priority: row.priority,
            budgetAmount: row.budgetAmount,
            requiredByDate: row.requiredByDate,
            items: row.items.map((item) => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
            })),
            attachments: (row.attachments ?? []).map((file) => ({
              ...file,
              href: file.href ? resolveOpsMediaUrl(file.href) : file.href,
            })),
            history: row.history,
            related: row.related ?? null,
          }}
          requestCommands={requestCommands}
          quotationCommands={quotationCommands}
          onRequestCommand={(command, extra) => void runRequestCommand(command, extra)}
          onQuotationCommand={(quotationId, command) => {
            if (command === "review" || command === "issue") {
              void runQuotationCommand(quotationId, command);
            }
          }}
          onOpenQuotation={(quotationId) => navigate(`/quotations?focus=${quotationId}`)}
          onOpenShipment={(shipmentId) => navigate(`/shipments?focus=${shipmentId}`)}
          onOpenInvoice={() => navigate("/invoices")}
          onOpenPayment={() => navigate("/payments")}
          getAccessToken={() => auth.ensureSession()}
          onRequestIdCopied={() => {
            setCopiedFlash("Request ID copied.");
            window.setTimeout(() => setCopiedFlash(null), 2500);
          }}
          extraActions={
            auth.permissions.includes("quotation:create") &&
            (row.status === "accepted_for_sourcing" || row.status === "sourcing") ? (
              <Link className="hamd-btn hamd-btn--secondary" to={`/quotations?requestId=${row.id}`}>
                Open quotations
              </Link>
            ) : null
          }
        />
      ) : null}
    </OpsPage>
  );
}
