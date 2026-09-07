import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  createFetchGate,
  isCancelledRequest,
  userFacingRequestError,
} from "@hamd/ui/auth";
import {
  BuyerRequestsWorkspace,
  type BuyerRequestRecord,
  type ProcurementRequestRecord,
} from "@hamd/ui/procurement";

import { useToast } from "../app/providers/ToastProvider.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { HostPage } from "../components/HostChrome.js";
import {
  archiveProcurementRequest,
  deleteCancelledProcurementRequest,
  duplicateProcurementRequest,
  listProcurementRequests,
  ProcurementApiError,
  requireProcurementToken,
  transitionProcurementRequest,
} from "./procurement-api.js";

function isImageAttachment(kind: string, href: string): boolean {
  const value = `${kind} ${href}`.toLowerCase();
  return (
    value.includes("image") ||
    /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(href)
  );
}

function toBuyerRow(row: ProcurementRequestRecord): BuyerRequestRecord {
  const extra = Math.max(0, row.items.length - 1);
  const image = row.attachments.find((item) => isImageAttachment(item.kind, item.href));
  return {
    id: row.id,
    publicCode: row.publicCode,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    organizationName: row.organizationName,
    requesterName: row.requesterName,
    categoryLabel: row.items[0]?.description?.slice(0, 80) ?? null,
    related: row.related ?? null,
    itemSummary: row.items[0]?.description?.slice(0, 90) ?? row.title,
    extraItemCount: extra,
    thumbnailUrl: image?.href ?? null,
    thumbnailAlt: image?.name ?? null,
    rowVersion: row.rowVersion,
  };
}

type ListLocationState = {
  flash?: string;
  removedId?: string;
};

export function ProcurementRequestsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { push: pushToast } = useToast();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<ProcurementRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const query = params.get("q") ?? "";
  const status = params.get("status") ?? "all";
  const sort = params.get("sort") ?? "updated";
  const focusId = params.get("focus") ?? "";
  const [searchDraft, setSearchDraft] = useState(query);
  const gate = useMemo(() => createFetchGate(), []);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const flashConsumed = useRef(false);

  const refresh = useCallback(async (mode: "load" | "background" = "load") => {
    const generation = gate.next();
    if (mode === "load") setError(null);
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      const next = await listProcurementRequests(token, {
        pageSize: 100,
        q: query.trim() || undefined,
        status: status === "all" ? undefined : status,
      });
      if (!gate.isCurrent(generation)) return;
      setRows(next);
      if (mode === "load") setError(null);
    } catch (err) {
      if (!gate.isCurrent(generation)) return;
      if (isCancelledRequest(err)) return;
      const message =
        err instanceof ProcurementApiError
          ? err.message
          : "Unable to load procurement requests.";
      if (mode === "background" || rowsRef.current.length > 0) {
        pushToast({
          title: "Couldn’t refresh the list",
          description:
            userFacingRequestError(
              err,
              "Showing the last loaded requests.",
            ) ?? "Showing the last loaded requests.",
          tone: "warning",
        });
        return;
      }
      setError(message);
    } finally {
      if (gate.isCurrent(generation)) setLoading(false);
    }
  }, [auth.ensureSession, gate, pushToast, query, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const state = (location.state ?? null) as ListLocationState | null;
    if (flashConsumed.current) return;
    if (state?.removedId) {
      setRows((current) => current.filter((row) => row.id !== state.removedId));
    }
    if (state?.flash) {
      flashConsumed.current = true;
      pushToast({ title: state.flash, tone: "success" });
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location.pathname, location.search, location.state, navigate, pushToast]);

  useEffect(() => {
    if (!focusId || loading) return;
    const node = document.querySelector(`[data-request-id="${focusId}"]`);
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [focusId, loading, rows]);

  const hubRows = useMemo(() => {
    const mapped = rows.map(toBuyerRow);
    return [...mapped].sort((a, b) => {
      if (sort === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sort === "code") {
        return a.publicCode.localeCompare(b.publicCode);
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [rows, sort]);

  const summary = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((row) =>
      ["fulfilled", "closed"].includes(row.status),
    ).length;
    const actionRequired = rows.filter((row) =>
      ["draft", "needs_clarification", "quote_issued"].includes(row.status),
    ).length;
    const active = rows.filter(
      (row) =>
        !["fulfilled", "closed", "cancelled", "declined", "expired"].includes(row.status),
    ).length;
    return [
      { id: "total", label: "Total requests", value: total },
      { id: "active", label: "Active", value: active },
      { id: "action", label: "Action required", value: actionRequired },
      { id: "done", label: "Completed", value: completed },
    ];
  }, [rows]);

  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
    { value: "needs_clarification", label: "Clarification required" },
    { value: "sourcing", label: "Sourcing" },
    { value: "quote_issued", label: "Quoted" },
    { value: "purchase_in_progress", label: "Fulfilment" },
    { value: "fulfilled", label: "Fulfilled" },
    { value: "closed", label: "Closed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const sortOptions = [
    { value: "updated", label: "Updated" },
    { value: "created", label: "Submitted" },
    { value: "code", label: "Reference" },
  ];

  const patchParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next);
  };

  useEffect(() => {
    setSearchDraft(query);
  }, [query]);

  useEffect(() => {
    if (searchDraft === query) return;
    const timer = window.setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchDraft) next.set("q", searchDraft);
        else next.delete("q");
        return next;
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchDraft, query, setParams]);

  const mutationMessage = (err: unknown, fallback: string) =>
    err instanceof ProcurementApiError ? err.message : fallback;

  return (
    <HostPage className="hamd-web-procurement hamd-list-queue">
      <BuyerRequestsWorkspace
        rows={hubRows}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          void refresh();
        }}
        onRequestIdCopied={() =>
          pushToast({ title: "Request ID copied.", tone: "success" })
        }
        summary={summary}
        query={searchDraft}
        onQueryChange={setSearchDraft}
        status={status}
        onStatusChange={(value) =>
          patchParams((next) => {
            if (value === "all") next.delete("status");
            else next.set("status", value);
          })
        }
        statusOptions={statusOptions}
        sort={sort}
        onSortChange={(value) =>
          patchParams((next) => {
            if (value === "updated") next.delete("sort");
            else next.set("sort", value);
          })
        }
        sortOptions={sortOptions}
        onOpen={(row) => navigate(`/app/requests/${row.id}`)}
        onDuplicate={async (row) => {
          try {
            const token = await requireProcurementToken(auth.ensureSession);
            const copy = await duplicateProcurementRequest(token, row.id);
            navigate(`/app/requests/new?duplicate=${copy.id}`);
          } catch (err) {
            if (isCancelledRequest(err)) return;
            pushToast({
              title: mutationMessage(err, "Unable to duplicate this request."),
              tone: "danger",
            });
          }
        }}
        onCancelRequest={async (row) => {
          try {
            const token = await requireProcurementToken(auth.ensureSession);
            const updated = await transitionProcurementRequest(token, row.id, "cancel", {
              rowVersion: row.rowVersion ?? 1,
              reason: "Cancelled from My Requests.",
            });
            setRows((current) =>
              current.map((item) => (item.id === updated.id ? updated : item)),
            );
            setError(null);
            pushToast({ title: "Request cancelled.", tone: "success" });
          } catch (err) {
            if (isCancelledRequest(err)) return;
            pushToast({
              title: mutationMessage(err, "Unable to cancel this request."),
              tone: "danger",
            });
            throw err;
          }
        }}
        onDeleteDraft={async (row) => {
          try {
            const token = await requireProcurementToken(auth.ensureSession);
            await archiveProcurementRequest(token, row.id, row.rowVersion ?? 1);
            setRows((current) => current.filter((item) => item.id !== row.id));
            setError(null);
            pushToast({ title: "Request deleted.", tone: "success" });
          } catch (err) {
            if (isCancelledRequest(err)) return;
            pushToast({
              title: mutationMessage(err, "Unable to delete this request."),
              tone: "danger",
            });
            throw err;
          }
        }}
        onRemoveCancelled={async (row) => {
          try {
            const token = await requireProcurementToken(auth.ensureSession);
            await deleteCancelledProcurementRequest(token, row.id, row.rowVersion ?? 1);
            setRows((current) => current.filter((item) => item.id !== row.id));
            setError(null);
            pushToast({ title: "Request deleted.", tone: "success" });
          } catch (err) {
            if (isCancelledRequest(err)) return;
            pushToast({
              title: mutationMessage(err, "Unable to delete this request."),
              tone: "danger",
            });
            throw err;
          }
        }}
        newAction={
          <Link className="hamd-btn hamd-btn--primary hamd-buyer-requests__new" to="/app/requests/new">
            <span className="hamd-buyer-requests__new-full">New Request</span>
            <span className="hamd-buyer-requests__new-short">New</span>
          </Link>
        }
        emptyAction={
          <Link className="hamd-btn hamd-btn--primary" to="/app/requests/new">
            Create Request
          </Link>
        }
      />
    </HostPage>
  );
}
