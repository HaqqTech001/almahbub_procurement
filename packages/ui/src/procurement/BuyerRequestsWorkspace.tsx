import { useEffect, useState, type ReactNode } from "react";

import { ConfirmationDialog, Dialog } from "../primitives/Dialog.js";
import { Button } from "../primitives/Button.js";
import { CopyRequestIdButton } from "../primitives/CopyRequestIdButton.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { ErrorState } from "../primitives/ErrorState.js";
import { cx } from "../utils/cx.js";
import { availableCommands, procurementActionRequiredCopy, procurementStatusLabel } from "./types.js";
import type { RequestHubRow } from "./RequestHub.js";

export type BuyerRequestRecord = RequestHubRow & {
  itemSummary?: string | null;
  extraItemCount?: number;
  thumbnailUrl?: string | null;
  thumbnailAlt?: string | null;
  rowVersion?: number;
};

export type BuyerSummaryItem = {
  id: string;
  label: string;
  value: number;
};

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function itemCountLabel(row: BuyerRequestRecord): string {
  const extra = row.extraItemCount ?? 0;
  const total = extra + (row.itemSummary || row.title ? 1 : 0);
  if (total <= 1) return "1 item";
  return `${total} items`;
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <circle cx="10" cy="4.5" r="1.4" fill="currentColor" />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" />
      <circle cx="10" cy="15.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="6.25" r="0.9" fill="currentColor" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
      <rect
        x="8"
        y="10"
        width="32"
        height="28"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M14 18h20M14 24h14M14 30h10" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function rowCapabilities(row: BuyerRequestRecord) {
  const canCancel = availableCommands(row.status).includes("cancel") && row.status !== "draft";
  const canDeleteDraft = row.status === "draft";
  const canRemoveCancelled = row.status === "cancelled";
  return { canCancel, canDeleteDraft, canRemoveCancelled };
}

export function BuyerRequestsWorkspace({
  rows,
  loading,
  error,
  query,
  onQueryChange,
  status,
  onStatusChange,
  statusOptions,
  sort,
  onSortChange,
  sortOptions,
  onOpen,
  onDuplicate,
  onCancelRequest,
  onDeleteDraft,
  onRemoveCancelled,
  onRetry,
  onRequestIdCopied,
  newAction,
  emptyAction,
}: {
  rows: readonly BuyerRequestRecord[];
  loading?: boolean;
  error?: string | null;
  summary: readonly BuyerSummaryItem[];
  query: string;
  onQueryChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: readonly { value: string; label: string }[];
  sort: string;
  onSortChange: (value: string) => void;
  sortOptions: readonly { value: string; label: string }[];
  onOpen: (row: BuyerRequestRecord) => void;
  onDuplicate?: ((row: BuyerRequestRecord) => void | Promise<void>) | undefined;
  onCancelRequest?: ((row: BuyerRequestRecord) => void | Promise<void>) | undefined;
  onDeleteDraft?: ((row: BuyerRequestRecord) => void | Promise<void>) | undefined;
  onRemoveCancelled?: ((row: BuyerRequestRecord) => void | Promise<void>) | undefined;
  onRetry?: (() => void) | undefined;
  onRequestIdCopied?: ((value: string) => void) | undefined;
  newAction: ReactNode;
  emptyAction?: ReactNode;
}) {
  const showEmpty = !loading && rows.length === 0 && !error;
  const filterCount = (status !== "all" ? 1 : 0) + (sort !== "updated" ? 1 : 0);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState(status);
  const [draftSort, setDraftSort] = useState(sort);
  const [pendingDelete, setPendingDelete] = useState<BuyerRequestRecord | null>(null);
  const [pendingCancel, setPendingCancel] = useState<BuyerRequestRecord | null>(null);
  const [pendingRemove, setPendingRemove] = useState<BuyerRequestRecord | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (!menuId) return;
    const onDoc = () => setMenuId(null);
    const timer = window.setTimeout(() => {
      window.addEventListener("click", onDoc);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("click", onDoc);
    };
  }, [menuId]);

  const runPending = async (
    row: BuyerRequestRecord | null,
    action?: (row: BuyerRequestRecord) => void | Promise<void>,
    close?: () => void,
  ) => {
    if (!row || !action) return;
    setActionBusy(true);
    try {
      await action(row);
      close?.();
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="hamd-buyer-requests">
      <header className="hamd-buyer-requests__header">
        <div className="hamd-buyer-requests__heading">
          <h1>My Requests</h1>
          <p>Track and manage your procurement requests.</p>
        </div>
        {newAction}
      </header>

      <div className="hamd-buyer-requests__toolbar" role="search">
        <label className="hamd-buyer-requests__search">
          <span className="hamd-sr-only">Search requests</span>
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12.5 12.5L17 17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search requests"
          />
          {query ? (
            <button
              type="button"
              className="hamd-buyer-requests__clear"
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
            >
              ×
            </button>
          ) : null}
        </label>
        <div className="hamd-buyer-requests__toolbar-actions">
          <label className="hamd-buyer-requests__inline-filter">
            <span className="hamd-sr-only">Status</span>
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              aria-label="Filter"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="hamd-buyer-requests__inline-sort">
            <span className="hamd-sr-only">Sort</span>
            <select
              className="hamd-buyer-requests__sort"
              value={sort}
              onChange={(event) => onSortChange(event.target.value)}
              aria-label="Sort"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="hamd-buyer-requests__filters-btn"
            aria-expanded={filterOpen}
            onClick={() => {
              setDraftStatus(status);
              setDraftSort(sort);
              setFilterOpen(true);
            }}
          >
            Filter{filterCount ? ` ${filterCount}` : ""}
          </button>
        </div>
        <Dialog
          open={filterOpen}
          title="Filters"
          className="hamd-dialog--sheet"
          onClose={() => setFilterOpen(false)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => {
                  onStatusChange("all");
                  onSortChange("updated");
                  setDraftStatus("all");
                  setDraftSort("updated");
                  setFilterOpen(false);
                }}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onStatusChange(draftStatus);
                  onSortChange(draftSort);
                  setFilterOpen(false);
                }}
              >
                Apply Filters
              </Button>
            </>
          }
        >
          <div className="hamd-module-toolbar__sheet">
            <label className="hamd-module-toolbar__filter">
              <span className="hamd-module-toolbar__filter-label">Status</span>
              <select
                className="hamd-module-toolbar__filter-select"
                value={draftStatus}
                onChange={(event) => setDraftStatus(event.target.value)}
                aria-label="Status"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="hamd-module-toolbar__filter">
              <span className="hamd-module-toolbar__filter-label">Sort</span>
              <select
                className="hamd-module-toolbar__filter-select"
                value={draftSort}
                onChange={(event) => setDraftSort(event.target.value)}
                aria-label="Sort"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Dialog>
      </div>

      {error ? (
        <div className="hamd-buyer-requests__error-wrap">
          <ErrorState
            title="We couldn't load your requests."
            description={error}
            {...(onRetry ? { onRetry, retryLabel: "Try Again" } : {})}
          />
        </div>
      ) : (
        <div className="hamd-buyer-requests__board">
          {loading ? (
            <ul className="hamd-buyer-requests__list" aria-busy="true" aria-label="Loading requests">
              {Array.from({ length: 7 }).map((_, index) => (
                <li key={index} className="hamd-buyer-requests__item">
                  <div className="hamd-buyer-requests__row hamd-buyer-requests__row--skel">
                    <span className="hamd-sr-only">Loading request</span>
                  </div>
                  <div className="hamd-buyer-requests__card hamd-buyer-requests__card--skel">
                    <span className="hamd-sr-only">Loading request</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {showEmpty ? (
            <div className="hamd-buyer-requests__empty">
              <EmptyIcon />
              <h2>
                {query.trim() || status !== "all"
                  ? "No requests match these filters"
                  : "No requests yet"}
              </h2>
              <p>
                {query.trim() || status !== "all"
                  ? "Adjust search or status to see more of your procurement records."
                  : "Create your first procurement request and track it here."}
              </p>
              {query.trim() || status !== "all" ? null : emptyAction}
            </div>
          ) : null}

          {!loading && rows.length > 0 ? (
            <ul className="hamd-buyer-requests__list" role="list">
              <li className="hamd-buyer-requests__queue hamd-buyer-requests__cols" aria-hidden="true">
                <span className="hamd-buyer-requests__cell--reference">Reference</span>
                <span className="hamd-buyer-requests__cell--request">Request</span>
                <span className="hamd-buyer-requests__cell--status">Status</span>
                <span className="hamd-buyer-requests__cell--updated">Updated</span>
                <span className="hamd-buyer-requests__cell--actions" />
              </li>
              {rows.map((row) => {
                const actionCopy = procurementActionRequiredCopy(row.status);
                const statusLabel = procurementStatusLabel(row.status);
                const { canCancel, canDeleteDraft, canRemoveCancelled } = rowCapabilities(row);
                const actionNote =
                  row.status === "needs_clarification"
                    ? "More information is required."
                    : actionCopy;
                return (
                  <li key={row.id} className="hamd-buyer-requests__item" data-request-id={row.id}>
                    <article
                      className={cx(
                        "hamd-buyer-requests__record",
                        actionCopy && "hamd-buyer-requests__record--action",
                      )}
                      data-status={row.status}
                    >
                      <div
                        className="hamd-buyer-requests__queue hamd-buyer-requests__queue-row"
                        role="link"
                        tabIndex={0}
                        aria-label={`${row.publicCode} ${row.title}`}
                        onClick={() => onOpen(row)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onOpen(row);
                          }
                        }}
                      >
                        <div className="hamd-buyer-requests__cell--reference hamd-buyer-requests__reference">
                          <p
                            className="hamd-buyer-requests__code"
                            title={row.publicCode}
                          >
                            {row.publicCode}
                          </p>
                          <CopyRequestIdButton
                            value={row.publicCode}
                            onCopied={onRequestIdCopied}
                          />
                        </div>
                        <div className="hamd-buyer-requests__identity hamd-buyer-requests__cell--request">
                          <h2 className="hamd-buyer-requests__title">{row.title}</h2>
                          <p className="hamd-buyer-requests__items">
                            {row.itemSummary || row.title}
                            {row.extraItemCount ? ` +${row.extraItemCount} more` : ""}
                          </p>
                          {actionNote ? (
                            <p className="hamd-buyer-requests__queue-note">{actionNote}</p>
                          ) : null}
                        </div>
                        <div className="hamd-buyer-requests__cell--status">
                          <StatusBadge
                            status={row.status}
                            label={statusLabel}
                            className="hamd-buyer-requests__status"
                          />
                        </div>
                        <time
                          className="hamd-buyer-requests__updated hamd-buyer-requests__cell--updated"
                          dateTime={row.updatedAt}
                        >
                          {formatWhen(row.updatedAt)}
                        </time>
                        <div
                          className="hamd-buyer-requests__more hamd-buyer-requests__cell--actions"
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="hamd-buyer-requests__more-btn"
                            aria-haspopup="menu"
                            aria-expanded={menuId === row.id}
                            aria-label={`More actions for ${row.publicCode}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              setMenuId((current) => (current === row.id ? null : row.id));
                            }}
                          >
                            <MoreIcon />
                          </button>
                          {menuId === row.id ? (
                            <div className="hamd-buyer-requests__menu" role="menu">
                              <button type="button" role="menuitem" onClick={() => { setMenuId(null); onOpen(row); }}>
                                View request
                              </button>
                              {onDuplicate ? (
                                <button type="button" role="menuitem" onClick={() => { setMenuId(null); void onDuplicate(row); }}>
                                  Duplicate request
                                </button>
                              ) : null}
                              {canCancel && onCancelRequest ? (
                                <button type="button" role="menuitem" onClick={() => { setMenuId(null); setPendingCancel(row); }}>
                                  Cancel Request
                                </button>
                              ) : null}
                              {canDeleteDraft && onDeleteDraft ? (
                                <button type="button" role="menuitem" onClick={() => { setMenuId(null); setPendingDelete(row); }}>
                                  Delete Request
                                </button>
                              ) : null}
                              {canRemoveCancelled && onRemoveCancelled ? (
                                <button type="button" role="menuitem" onClick={() => { setMenuId(null); setPendingRemove(row); }}>
                                  Delete Request
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className="hamd-buyer-requests__card">
                        <div className="hamd-buyer-requests__card-head">
                          <div className="hamd-buyer-requests__reference">
                            <p className="hamd-buyer-requests__code">{row.publicCode}</p>
                            <CopyRequestIdButton
                              value={row.publicCode}
                              onCopied={onRequestIdCopied}
                            />
                          </div>
                          <StatusBadge
                            status={row.status}
                            label={statusLabel}
                            className="hamd-buyer-requests__status"
                          />
                        </div>
                        <h2 className="hamd-buyer-requests__title">{row.title}</h2>
                        <p className="hamd-buyer-requests__items">{itemCountLabel(row)}</p>
                        <time className="hamd-buyer-requests__updated" dateTime={row.updatedAt}>
                          Updated {formatWhen(row.updatedAt)}
                        </time>
                        {actionNote ? (
                          <div className="hamd-buyer-requests__action-note">
                            <InfoIcon />
                            <span>{actionNote}</span>
                            <button
                              type="button"
                              className="hamd-buyer-requests__provide"
                              onClick={() => onOpen(row)}
                            >
                              Provide information
                            </button>
                          </div>
                        ) : null}
                        <div className="hamd-buyer-requests__card-foot">
                          <button
                            type="button"
                            className="hamd-btn hamd-btn--secondary hamd-buyer-requests__view"
                            onClick={() => onOpen(row)}
                          >
                            View Request
                          </button>
                          <div className="hamd-buyer-requests__more">
                            <button
                              type="button"
                              className="hamd-buyer-requests__more-btn"
                              aria-haspopup="menu"
                              aria-expanded={menuId === `${row.id}-mobile`}
                              aria-label={`More actions for ${row.publicCode}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setMenuId((current) =>
                                  current === `${row.id}-mobile` ? null : `${row.id}-mobile`,
                                );
                              }}
                            >
                              <MoreIcon />
                            </button>
                            {menuId === `${row.id}-mobile` ? (
                              <div className="hamd-buyer-requests__menu" role="menu">
                                {onDuplicate ? (
                                  <button type="button" role="menuitem" onClick={() => { setMenuId(null); void onDuplicate(row); }}>
                                    Duplicate request
                                  </button>
                                ) : null}
                                {canCancel && onCancelRequest ? (
                                  <button type="button" role="menuitem" onClick={() => { setMenuId(null); setPendingCancel(row); }}>
                                    Cancel Request
                                  </button>
                                ) : null}
                                {canDeleteDraft && onDeleteDraft ? (
                                  <button type="button" role="menuitem" onClick={() => { setMenuId(null); setPendingDelete(row); }}>
                                    Delete Request
                                  </button>
                                ) : null}
                                {canRemoveCancelled && onRemoveCancelled ? (
                                  <button type="button" role="menuitem" onClick={() => { setMenuId(null); setPendingRemove(row); }}>
                                    Delete Request
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      )}
      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete this request?"
        cancelLabel="Keep Request"
        confirmLabel="Delete Request"
        busyLabel="Deleting..."
        busy={actionBusy}
        tone="danger"
        onCancel={() => {
          if (!actionBusy) setPendingDelete(null);
        }}
        onConfirm={() => {
          void runPending(pendingDelete, onDeleteDraft, () => setPendingDelete(null));
        }}
      >
        <p>This will remove the draft and its unsent information.</p>
      </ConfirmationDialog>
      <ConfirmationDialog
        open={Boolean(pendingCancel)}
        title="Cancel Request?"
        cancelLabel="Keep Request"
        confirmLabel="Cancel Request"
        busyLabel="Cancelling..."
        busy={actionBusy}
        tone="danger"
        onCancel={() => {
          if (!actionBusy) setPendingCancel(null);
        }}
        onConfirm={() => {
          void runPending(pendingCancel, onCancelRequest, () => setPendingCancel(null));
        }}
      >
        <p>This procurement request will be cancelled. The business record is retained.</p>
      </ConfirmationDialog>
      <ConfirmationDialog
        open={Boolean(pendingRemove)}
        title="Delete this request?"
        cancelLabel="Keep Request"
        confirmLabel="Delete Request"
        busyLabel="Deleting..."
        busy={actionBusy}
        tone="danger"
        onCancel={() => {
          if (!actionBusy) setPendingRemove(null);
        }}
        onConfirm={() => {
          void runPending(pendingRemove, onRemoveCancelled, () => setPendingRemove(null));
        }}
      >
        <p>This request will no longer appear in My Requests.</p>
      </ConfirmationDialog>
    </div>
  );
}
