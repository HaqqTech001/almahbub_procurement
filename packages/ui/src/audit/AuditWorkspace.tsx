import { useState } from "react";
import { cx } from "../utils/cx.js";
import { useAuditDirectory } from "./useAuditDirectory.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EXPORT_FORMATS,
  AUDIT_OUTCOMES,
  AUDIT_SEVERITIES,
  auditCategoryLabel,
  auditExportLabel,
  auditOutcomeLabel,
  auditSeverityLabel,
  emptyAuditFilters,
  humanizeAuditAction,
  retentionDaysFor,
  type AuditEvent,
  type AuditExportFormat,
  type AuditExportRequest,
  type AuditRetentionPolicy,
} from "./types.js";

export type AuditWorkspaceTab = "timeline" | "detail" | "retention";

export type AuditWorkspaceProps = {
  events: AuditEvent[];
  retention?: AuditRetentionPolicy | undefined;
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  canExport?: boolean | undefined;
  onSelect?: ((event: AuditEvent) => void) | undefined;
  onExport?: ((request: AuditExportRequest) => void | Promise<void>) | undefined;
  onOpenTarget?: ((event: AuditEvent) => void) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function AuditWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-aud", "hamd-aud--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-aud-skel hamd-aud-skel--bar" />
      <div className="hamd-aud-skel hamd-aud-skel--list" />
      <div className="hamd-aud-skel hamd-aud-skel--detail" />
    </div>
  );
}

/**
 * Enterprise Audit workspace - immutable event log with filter, search,
 * timeline, export, and retention visibility. Presentational; hosts own API.
 */
export function AuditWorkspace({
  events,
  retention,
  title = "Enterprise Audit",
  loading,
  className,
  canExport = true,
  onSelect,
  onExport,
  onOpenTarget,
}: AuditWorkspaceProps) {
  const directory = useAuditDirectory(events);
  const selected = directory.selected;
  const [tab, setTab] = useState<AuditWorkspaceTab>("timeline");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  if (loading) {
    return <AuditWorkspaceSkeleton className={className} />;
  }

  const run = async (fn?: () => void | Promise<void>, ok?: string) => {
    setError(null);
    try {
      await fn?.();
      if (ok) setToast(ok);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const exportFormat = async (format: AuditExportFormat) => {
    setExportBusy(true);
    try {
      await run(
        () =>
          onExport?.({
            format,
            filters: directory.filters,
            eventIds: directory.filtered.map((e) => e.id),
          }),
        `${auditExportLabel(format)} export started`,
      );
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <div
      className={cx(
        "hamd-aud",
        mobileOpen && "hamd-aud--detail-open",
        className,
      )}
    >
      <a className="hamd-aud__skip" href="#hamd-aud-detail">
        Skip to audit detail
      </a>

      <header className="hamd-aud__header">
        <div>
          <h1 className="hamd-aud__title">{title}</h1>
          <p className="hamd-aud__subtitle">
            A clear record of sign-ins, access changes, buying activity,
            approvals, payments, supplier updates, website edits, and security
            alerts. Search, filter, and export as needed.
          </p>
        </div>
      </header>

      <section
        className="hamd-aud-toolbar"
        aria-label="Audit filters and export"
      >
        <label className="hamd-aud-search">
          <span className="hamd-sr-only">Search audit events</span>
          <input
            type="search"
            placeholder="Search people, actions, or targets…"
            value={directory.filters.query}
            onChange={(e) =>
              directory.setFilters((prev) => ({
                ...prev,
                query: e.target.value,
                page: 1,
              }))
            }
          />
        </label>

        <button
          type="button"
          className="hamd-aud-filters-btn"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen((open) => !open)}
        >
          Filters
        </button>

        <div className={cx("hamd-aud-toolbar__advanced", filterOpen && "is-open")}>
        <label>
          Category
          <select
            value={directory.filters.category}
            onChange={(e) =>
              directory.setFilters((prev) => ({
                ...prev,
                category: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="all">All categories</option>
            {AUDIT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {auditCategoryLabel(category)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Outcome
          <select
            value={directory.filters.outcome}
            onChange={(e) =>
              directory.setFilters((prev) => ({
                ...prev,
                outcome: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="all">All outcomes</option>
            {AUDIT_OUTCOMES.map((outcome) => (
              <option key={outcome} value={outcome}>
                {auditOutcomeLabel(outcome)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Severity
          <select
            value={directory.filters.severity}
            onChange={(e) =>
              directory.setFilters((prev) => ({
                ...prev,
                severity: e.target.value,
                page: 1,
              }))
            }
          >
            <option value="all">All severities</option>
            {AUDIT_SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>
                {auditSeverityLabel(severity)}
              </option>
            ))}
          </select>
        </label>

        <label>
          From
          <input
            type="date"
            value={directory.filters.from ?? ""}
            onChange={(e) =>
              directory.setFilters((prev) => ({
                ...prev,
                from: e.target.value || undefined,
                page: 1,
              }))
            }
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={directory.filters.to ?? ""}
            onChange={(e) =>
              directory.setFilters((prev) => ({
                ...prev,
                to: e.target.value || undefined,
                page: 1,
              }))
            }
          />
        </label>

        <button
          type="button"
          className="hamd-aud-btn"
          onClick={() => directory.setFilters(emptyAuditFilters())}
        >
          Clear filters
        </button>
        </div>

        {canExport ? (
          <div className="hamd-aud-export" role="group" aria-label="Export">
            <span className="hamd-aud-export__label">Export</span>
            {AUDIT_EXPORT_FORMATS.map((format) => (
              <button
                key={format}
                type="button"
                className="hamd-aud-btn"
                disabled={exportBusy}
                onClick={() => void exportFormat(format)}
              >
                {auditExportLabel(format)}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <div className="hamd-aud__layout">
        <aside className="hamd-aud__directory" aria-label="Audit timeline">
          <nav className="hamd-aud-tabs" aria-label="Audit views">
            <button
              type="button"
              className={cx("hamd-aud-tab", tab === "timeline" && "is-active")}
              aria-current={tab === "timeline" ? "page" : undefined}
              onClick={() => setTab("timeline")}
            >
              Timeline
            </button>
            <button
              type="button"
              className={cx("hamd-aud-tab", tab === "retention" && "is-active")}
              aria-current={tab === "retention" ? "page" : undefined}
              onClick={() => {
                setTab("retention");
                setMobileOpen(true);
              }}
            >
              Retention
            </button>
          </nav>

          {tab === "timeline" ? (
            <>
              <ol className="hamd-aud-list" aria-label="Audit events">
                {directory.page.items.length === 0 ? (
                  <li className="hamd-aud-empty" role="status">
                    No audit events match this filter.
                  </li>
                ) : (
                  directory.page.items.map((event) => {
                    const active = selected?.id === event.id;
                    return (
                      <li key={event.id}>
                        <button
                          type="button"
                          className={cx(
                            "hamd-aud-row",
                            active && "is-active",
                          )}
                          data-severity={event.severity ?? "low"}
                          data-outcome={event.outcome}
                          aria-current={active ? "true" : undefined}
                          onClick={() => {
                            directory.select(event.id);
                            setTab("timeline");
                            setMobileOpen(true);
                            onSelect?.(event);
                          }}
                        >
                          <time dateTime={event.occurredAt}>
                            {formatWhen(event.occurredAt)}
                          </time>
                          <span className="hamd-aud-row__cat">
                            {auditCategoryLabel(String(event.category))}
                          </span>
                          <span className="hamd-aud-row__title">
                            {event.summary}
                          </span>
                          <span className="hamd-aud-row__meta">
                            {event.actor.name} ·{" "}
                            {auditOutcomeLabel(String(event.outcome))}
                            {event.severity
                              ? ` · ${auditSeverityLabel(String(event.severity))}`
                              : ""}
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ol>

              <div className="hamd-aud-pager" aria-label="Pagination">
                <button
                  type="button"
                  disabled={directory.page.page <= 1}
                  onClick={() =>
                    directory.setFilters((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }))
                  }
                >
                  Previous
                </button>
                <span>
                  {directory.page.page}/{directory.page.pageCount} ·{" "}
                  {directory.page.total} events
                </span>
                <button
                  type="button"
                  disabled={
                    directory.page.page >= directory.page.pageCount
                  }
                  onClick={() =>
                    directory.setFilters((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                >
                  Next
                </button>
              </div>
            </>
          ) : null}

          {tab === "retention" && retention ? (
            <div className="hamd-aud-retention" aria-label="Retention policy">
              <p>
                Default retention: <strong>{retention.defaultDays} days</strong>
              </p>
              {retention.lastReviewedAt ? (
                <p className="hamd-aud-muted">
                  Last reviewed {formatWhen(retention.lastReviewedAt)}
                </p>
              ) : null}
              {retention.legalHoldNote ? (
                <p className="hamd-aud-retention__note">
                  {retention.legalHoldNote}
                </p>
              ) : null}
              <ul>
                {AUDIT_CATEGORIES.map((category) => (
                  <li key={category}>
                    <span>{auditCategoryLabel(category)}</span>
                    <strong>
                      {retentionDaysFor(retention, category)} days
                    </strong>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {tab === "retention" && !retention ? (
            <p className="hamd-aud-empty" role="status">
              Retention policy not provided by host.
            </p>
          ) : null}
        </aside>

        <section
          id="hamd-aud-detail"
          className="hamd-aud__detail"
          aria-label="Audit event detail"
        >
          {selected ? (
            <>
              <button
                type="button"
                className="hamd-aud-back"
                onClick={() => setMobileOpen(false)}
              >
                Timeline
              </button>
              <header className="hamd-aud-detail__head">
                <p className="hamd-aud-detail__code">{selected.id}</p>
                <h2 className="hamd-aud-detail__title">{selected.summary}</h2>
                <p className="hamd-aud-detail__sub">
                  <span className="hamd-aud-pill">
                    {auditCategoryLabel(String(selected.category))}
                  </span>
                  <span
                    className="hamd-aud-pill"
                    data-outcome={selected.outcome}
                  >
                    {auditOutcomeLabel(String(selected.outcome))}
                  </span>
                  {selected.severity ? (
                    <span
                      className="hamd-aud-pill"
                      data-severity={selected.severity}
                    >
                      {auditSeverityLabel(String(selected.severity))}
                    </span>
                  ) : null}
                  {selected.legalHold ? (
                    <span className="hamd-aud-pill hamd-aud-pill--hold">
                      Legal hold
                    </span>
                  ) : null}
                </p>
              </header>

              <dl className="hamd-aud-facts">
                <div>
                  <dt>Occurred</dt>
                  <dd>
                    <time dateTime={selected.occurredAt}>
                      {formatWhen(selected.occurredAt)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt>Action</dt>
                  <dd>{humanizeAuditAction(selected.action)}</dd>
                </div>
                <div>
                  <dt>Actor</dt>
                  <dd>
                    {selected.actor.name}
                    {selected.actor.type ? ` (${selected.actor.type})` : ""}
                    {selected.actor.organizationName
                      ? ` · ${selected.actor.organizationName}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt>Target</dt>
                  <dd>
                    {selected.target
                      ? `${selected.target.label ?? selected.target.id ?? "-"} (${selected.target.type})`
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt>Reason</dt>
                  <dd>{selected.reason || "-"}</dd>
                </div>
                <div>
                  <dt>Correlation</dt>
                  <dd>{selected.correlationId || "-"}</dd>
                </div>
                <div>
                  <dt>Request</dt>
                  <dd>{selected.requestId || "-"}</dd>
                </div>
                <div>
                  <dt>IP / network</dt>
                  <dd>{selected.ipAddress || "-"}</dd>
                </div>
                <div>
                  <dt>Retention class</dt>
                  <dd>
                    {selected.retentionClass || "-"}
                    {retention
                      ? ` · ${retentionDaysFor(retention, String(selected.category))} days policy`
                      : ""}
                  </dd>
                </div>
              </dl>

              {selected.metadata ? (
                <pre className="hamd-aud-meta" aria-label="Safe metadata">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              ) : null}

              {selected.target && onOpenTarget ? (
                <button
                  type="button"
                  className="hamd-aud-btn hamd-aud-btn--primary"
                  onClick={() => onOpenTarget(selected)}
                >
                  Open related record
                </button>
              ) : null}
            </>
          ) : (
            <p className="hamd-aud-empty" role="status">
              Select an audit event from the timeline.
            </p>
          )}
        </section>
      </div>

      {error ? (
        <p className="hamd-aud-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
