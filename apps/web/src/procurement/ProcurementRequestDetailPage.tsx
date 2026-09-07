import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  RequestDetailView,
  customerQuotationCommands,
  customerRequestCommands,
  type ProcurementCommand,
  type ProcurementRequestRecord,
} from "@hamd/ui/procurement";
import {
  createFetchGate,
  isCancelledRequest,
  runMutationThenRefresh,
  userFacingRequestError,
} from "@hamd/ui/auth";

import { useAuth } from "../auth/session/AuthProvider.js";
import { HostAlert, HostLoading, HostPage } from "../components/HostChrome.js";
import { useToast } from "../app/providers/ToastProvider.js";
import { resolveMediaUrl } from "../lib/media-url.js";
import {
  archiveProcurementRequest,
  deleteCancelledProcurementRequest,
  getProcurementRequest,
  ProcurementApiError,
  requireProcurementToken,
  transitionProcurementRequest,
  updateProcurementRequest,
} from "./procurement-api.js";
import {
  requireQuotationToken,
  transitionQuotation,
} from "../quotations/quotation-api.js";

export function ProcurementRequestDetailPage() {
  const auth = useAuth();
  const { push: pushToast } = useToast();
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [row, setRow] = useState<ProcurementRequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
    () => (row ? customerRequestCommands(row.status, auth.permissions) : []),
    [auth.permissions, row],
  );
  const quotationCommands = useMemo(
    () =>
      customerQuotationCommands(row?.related?.quotations?.[0]?.status, auth.permissions),
    [auth.permissions, row],
  );

  const runRequestCommand = async (
    command: ProcurementCommand,
    extra?: { reason?: string },
  ) => {
    if (!row || busy) return;
    const reason =
      extra?.reason?.trim() ||
      (command === "cancel" || command === "request_revision"
        ? "Request action recorded by the buyer workspace."
        : undefined);
    const reasonText = reason ?? "";
    if (
      (command === "cancel" || command === "request_revision" || command === "submit") &&
      command !== "submit" &&
      reasonText.trim().length < 3
    ) {
      setError("A reason of at least 3 characters is required.");
      return;
    }
    if (command === "submit" && row.status === "needs_clarification" && reasonText.trim().length < 3) {
      setError("Please answer the clarification question.");
      return;
    }
    setBusy(true);
    setError(null);
    setRefreshWarning(null);
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      const updated = await transitionProcurementRequest(token, row.id, command, {
        rowVersion: row.rowVersion,
        reason: reason?.trim(),
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
    command: "accept" | "decline",
  ) => {
    if (!row || busy) return;
    const quoteRowVersion =
      row.related?.quotations?.find((item) => item.id === quotationId)?.rowVersion ?? 0;
    const reason =
      command === "decline"
        ? "Quotation declined by the buyer workspace."
        : undefined;
    const reasonText = reason ?? "";
    if (command === "decline" && reasonText.trim().length < 3) {
      setError("A decline reason is required.");
      return;
    }
    setBusy(true);
    setError(null);
    setRefreshWarning(null);
    try {
      const token = await requireQuotationToken(auth.ensureSession);
      const { refreshError } = await runMutationThenRefresh({
        mutate: () =>
          transitionQuotation(token, quotationId, command, {
            rowVersion: quoteRowVersion,
            reason: reason?.trim(),
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
    <HostPage className="hamd-web-procurement">
      <p>
        <Link to="/app/requests">← My requests</Link>
      </p>
      {error ? <HostAlert>{error}</HostAlert> : null}
      {refreshWarning ? <HostAlert>{refreshWarning}</HostAlert> : null}
      {loading && !row ? <HostLoading label="Loading request…" /> : null}
      {row ? (
        <RequestDetailView
          audience="customer"
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
            rowVersion: row.rowVersion,
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
              href: file.href ? resolveMediaUrl(file.href) : file.href,
            })),
            history: row.history,
            related: row.related ?? null,
          }}
          requestCommands={requestCommands}
          quotationCommands={quotationCommands}
          onRequestCommand={(command, extra) => void runRequestCommand(command, extra)}
          onQuotationCommand={(quotationId, command) => {
            if (command === "accept" || command === "decline") {
              void runQuotationCommand(quotationId, command);
            }
          }}
          onOpenQuotation={(quotationId) => navigate(`/app/quotations/${quotationId}`)}
          onOpenShipment={(shipmentId) => navigate(`/app/shipments/${shipmentId}`)}
          onOpenInvoice={() => navigate("/app/invoices")}
          onOpenPayment={() => navigate(`/app/payments`)}
          getAccessToken={() => auth.ensureSession()}
          onRequestIdCopied={() =>
            pushToast({ title: "Request ID copied.", tone: "success" })
          }
          onBuyerUpdate={async (patch) => {
            if (!row) return;
            const token = await requireProcurementToken(auth.ensureSession);
            const updated = await updateProcurementRequest(token, row.id, {
              rowVersion: row.rowVersion,
              destinationAddress: patch.destinationAddress,
              notes: patch.notes,
              items: patch.items?.map((item) => ({
                id: item.id,
                description: item.description,
                quantity: Number(item.quantity),
                unit: item.unit,
              })),
            });
            setRow(updated);
          }}
          onDelete={async () => {
            if (!row) return;
            gate.next();
            const token = await requireProcurementToken(auth.ensureSession);
            if (row.status === "draft") {
              await archiveProcurementRequest(token, row.id, row.rowVersion);
            } else {
              await deleteCancelledProcurementRequest(token, row.id, row.rowVersion);
            }
            setRow(null);
            navigate("/app/requests", {
              replace: true,
              state: { flash: "Request deleted.", removedId: row.id },
            });
          }}
        />
      ) : null}
      {!loading && !row && !error ? (
        <p role="status">Request not found.</p>
      ) : null}
    </HostPage>
  );
}
