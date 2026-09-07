import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  emptyProcurementFilters,
  filterProcurementRequests,
  paginateProcurementRows,
  type ProcurementDirectoryFilters,
  type ProcurementDraftPatch,
  type ProcurementRequestRecord,
} from "./types.js";

export function useProcurementDirectory(
  requests: ProcurementRequestRecord[],
) {
  const [filters, setFilters] = useState<ProcurementDirectoryFilters>(
    emptyProcurementFilters(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    requests[0]?.id ?? null,
  );

  const filtered = useMemo(
    () => filterProcurementRequests(requests, filters),
    [requests, filters],
  );
  const page = useMemo(
    () => paginateProcurementRows(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );
  const selected =
    filtered.find((r) => r.id === selectedId) ??
    page.items[0] ??
    filtered[0] ??
    null;

  return {
    filters,
    setFilters,
    filtered,
    page,
    selected,
    select: setSelectedId,
  };
}

/**
 * Draft autosave - debounces PATCH-shaped payloads. Hosts inject onSave.
 */
export function useRequestDraft(
  request: ProcurementRequestRecord | null,
  options?: {
    debounceMs?: number | undefined;
    onSave?: ((patch: ProcurementDraftPatch) => void | Promise<void>) | undefined;
  },
) {
  const debounceMs = options?.debounceMs ?? 800;
  const [draft, setDraft] = useState({
    title: request?.title ?? "",
    notes: request?.notes ?? "",
    destinationCountryCode: request?.destinationCountryCode ?? "",
    destinationAddress: request?.destinationAddress ?? "",
    priority: request?.priority ?? "normal",
    budgetAmount: request?.budgetAmount ?? null as number | null,
  });
  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowVersion = request?.rowVersion ?? 0;

  useEffect(() => {
    if (!request) return;
    setDraft({
      title: request.title,
      notes: request.notes ?? "",
      destinationCountryCode: request.destinationCountryCode ?? "",
      destinationAddress: request.destinationAddress ?? "",
      priority: request.priority,
      budgetAmount: request.budgetAmount ?? null,
    });
    setSaveState("idle");
  }, [request?.id, request?.rowVersion]);

  const flush = useCallback(
    async (next: typeof draft) => {
      if (!request || request.status !== "draft" || !options?.onSave) return;
      setSaveState("saving");
      setError(null);
      try {
        await options.onSave({
          title: next.title,
          notes: next.notes || null,
          destinationCountryCode: next.destinationCountryCode || null,
          destinationAddress: next.destinationAddress || null,
          priority: next.priority,
          budgetAmount: next.budgetAmount,
          rowVersion,
        });
        setSaveState("saved");
      } catch (err) {
        setSaveState("error");
        setError(err instanceof Error ? err.message : "Autosave failed.");
      }
    },
    [options, request, rowVersion],
  );

  const update = useCallback(
    (patch: Partial<typeof draft>) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        setSaveState("dirty");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          void flush(next);
        }, debounceMs);
        return next;
      });
    },
    [debounceMs, flush],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { draft, update, saveState, error, flush: () => flush(draft) };
}
