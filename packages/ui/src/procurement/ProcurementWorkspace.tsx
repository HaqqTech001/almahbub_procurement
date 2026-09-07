import { useId, useState } from "react";
import { cx } from "../utils/cx.js";
import {
  useProcurementDirectory,
  useRequestDraft,
} from "./useProcurementDirectory.js";
import {
  availableCommands,
  commandLabel,
  missionPhaseForStatus,
  procurementStatusLabel,
  type ProcurementAttachment,
  type ProcurementCommand,
  type ProcurementComment,
  type ProcurementDraftPatch,
  type ProcurementInternalNote,
  type ProcurementRequestRecord,
} from "./types.js";

export type ProcurementWorkspaceTab =
  | "overview"
  | "timeline"
  | "comments"
  | "attachments"
  | "notes"
  | "history"
  | "approvals"
  | "notifications"
  | "activity";

export type ProcurementWorkspaceProps = {
  requests: ProcurementRequestRecord[];
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  canViewInternalNotes?: boolean | undefined;
  canTransition?: boolean | undefined;
  createHref?: string | undefined;
  onCreate?: (() => void) | undefined;
  onDuplicate?: ((request: ProcurementRequestRecord) => void) | undefined;
  onDelete?: ((request: ProcurementRequestRecord) => void | Promise<void>) | undefined;
  onSelect?: ((request: ProcurementRequestRecord) => void) | undefined;
  onTransition?: ((
    requestId: string,
    command: ProcurementCommand,
    meta: { rowVersion: number; reason?: string },
  ) => void | Promise<void>) | undefined;
  onAutosave?: ((
    requestId: string,
    patch: ProcurementDraftPatch,
  ) => void | Promise<void>) | undefined;
  onAddComment?: ((
    requestId: string,
    body: string,
  ) => void | Promise<ProcurementComment | void>) | undefined;
  onAddInternalNote?: ((
    requestId: string,
    body: string,
  ) => void | Promise<ProcurementInternalNote | void>) | undefined;
  onUploadAttachment?: ((
    requestId: string,
    file: File,
  ) => void | Promise<ProcurementAttachment | void>) | undefined;
  onOpenAttachment?: ((
    attachment: ProcurementAttachment,
  ) => void | Promise<void>) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function ProcurementWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-pr", "hamd-pr--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-pr-skel hamd-pr-skel--list" />
      <div className="hamd-pr-skel hamd-pr-skel--detail" />
    </div>
  );
}

/**
 * Procurement request lifecycle workspace.
 * Preserves API status codes; mission labels are display aliases.
 * Autosave, timeline, comments, attachments, notes, history, approvals,
 * notifications, and activity are presentational with injected handlers.
 */
export function ProcurementWorkspace({
  requests,
  title = "Procurement requests",
  loading,
  className,
  canViewInternalNotes = true,
  canTransition = true,
  createHref,
  onCreate,
  onDuplicate,
  onDelete,
  onSelect,
  onTransition,
  onAutosave,
  onAddComment,
  onAddInternalNote,
  onUploadAttachment,
  onOpenAttachment,
}: ProcurementWorkspaceProps) {
  const commentId = useId();
  const noteId = useId();
  const fileId = useId();
  const [tab, setTab] = useState<ProcurementWorkspaceTab>("overview");
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const directory = useProcurementDirectory(requests);
  const selected = directory.selected;

  const draft = useRequestDraft(
    selected,
    selected && onAutosave
      ? {
          onSave: (patch) => onAutosave(selected.id, patch),
        }
      : {},
  );

  if (loading) {
    return <ProcurementWorkspaceSkeleton className={className} />;
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

  const tabs: { id: ProcurementWorkspaceTab; label: string; hidden?: boolean }[] =
    [
      { id: "overview", label: "Overview" },
      { id: "timeline", label: "Timeline" },
      { id: "comments", label: "Comments" },
      { id: "attachments", label: "Attachments" },
      { id: "notes", label: "Internal notes", hidden: !canViewInternalNotes },
      { id: "history", label: "History" },
      { id: "approvals", label: "Approvals" },
      { id: "notifications", label: "Notifications" },
      { id: "activity", label: "Activity" },
    ];

  const commands = selected
    ? availableCommands(String(selected.status))
    : [];

  return (
    <div
      className={cx("hamd-pr", mobileOpen && "hamd-pr--detail-open", className)}
    >
      <a className="hamd-pr__skip" href="#hamd-pr-detail">
        Skip to request detail
      </a>

      <header className="hamd-pr__header">
        <div>
          <h1 className="hamd-pr__title">{title}</h1>
          <p className="hamd-pr__subtitle">
            Track drafts through delivery. Autosave keeps unfinished work, and
            the timeline shows who owns the next step.
          </p>
        </div>
        <div className="hamd-pr__header-actions">
          {createHref ? (
            <a
              className="hamd-btn hamd-btn--primary"
              href={createHref}
              data-tour="create-request"
              data-guide="create-request"
            >
              New request
            </a>
          ) : null}
          {onCreate ? (
            <button
              type="button"
              className="hamd-btn hamd-btn--primary"
              data-tour={createHref ? undefined : "create-request"}
              data-guide={createHref ? undefined : "create-request"}
              onClick={onCreate}
            >
              New request
            </button>
          ) : null}
        </div>
      </header>

      <div className="hamd-pr__layout">
        <aside className="hamd-pr__directory" aria-label="Request directory">
          <div className="hamd-pr-filters">
            <label className="hamd-sr-only" htmlFor="hamd-pr-q">
              Search requests
            </label>
            <input
              id="hamd-pr-q"
              type="search"
              placeholder="Search code, title, owner…"
              value={directory.filters.query}
              onChange={(e) =>
                directory.setFilters((prev) => ({
                  ...prev,
                  query: e.target.value,
                  page: 1,
                }))
              }
            />
            <label>
              Status
              <select
                value={directory.filters.status}
                onChange={(e) =>
                  directory.setFilters((prev) => ({
                    ...prev,
                    status: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="sourcing">Pending supplier</option>
                <option value="quote_issued">Quoted</option>
                <option value="approved">Approved</option>
                <option value="declined">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <label>
              Priority
              <select
                value={directory.filters.priority}
                onChange={(e) =>
                  directory.setFilters((prev) => ({
                    ...prev,
                    priority: e.target.value,
                    page: 1,
                  }))
                }
              >
                <option value="all">All</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
          </div>

          <ul
            className="hamd-pr-list"
            role="list"
            aria-label="Requests"
            data-tour="request-list"
            data-guide="request-list"
          >
            {directory.page.items.map((row) => {
              const active = selected?.id === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={cx("hamd-pr-row", active && "is-active")}
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      directory.select(row.id);
                      setMobileOpen(true);
                      setTab("overview");
                      onSelect?.(row);
                    }}
                  >
                    <span className="hamd-pr-row__code">{row.publicCode}</span>
                    <span className="hamd-pr-row__title">{row.title}</span>
                    <span className="hamd-pr-row__meta">
                      {procurementStatusLabel(String(row.status))} ·{" "}
                      {row.priority}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hamd-pr-pager" aria-label="Pagination">
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
              {directory.page.page}/{directory.page.pageCount}
            </span>
            <button
              type="button"
              disabled={directory.page.page >= directory.page.pageCount}
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
        </aside>

        <section
          id="hamd-pr-detail"
          className="hamd-pr__detail"
          aria-label="Request detail"
        >
          {selected ? (
            <>
              <header className="hamd-pr-detail__head">
                <button
                  type="button"
                  className="hamd-pr-back"
                  onClick={() => setMobileOpen(false)}
                >
                  Directory
                </button>
                <div>
                  <p className="hamd-pr-detail__code">{selected.publicCode}</p>
                  <h2 className="hamd-pr-detail__title">{selected.title}</h2>
                  <p className="hamd-pr-detail__sub">
                    <span
                      className="hamd-pr-pill"
                      data-status={selected.status}
                    >
                      {procurementStatusLabel(String(selected.status))}
                    </span>
                    <span className="hamd-pr-pill">
                      Phase {missionPhaseForStatus(String(selected.status))}
                    </span>
                    <span className="hamd-pr-pill">{selected.priority}</span>
                  </p>
                </div>
              </header>

              {canTransition && commands.length > 0 ? (
                <div
                  className="hamd-pr-actions"
                  role="group"
                  aria-label="Lifecycle actions"
                >
                  {commands.map((command) => (
                    <button
                      key={command}
                      type="button"
                      className={cx(
                        "hamd-pr-btn",
                        (command === "approve" || command === "submit") &&
                          "hamd-pr-btn--primary",
                        (command === "decline" || command === "cancel") &&
                          "hamd-pr-btn--danger",
                      )}
                      onClick={() =>
                        void run(
                          () =>
                            onTransition?.(selected.id, command, {
                              rowVersion: selected.rowVersion,
                              ...(reason.trim()
                                ? { reason: reason.trim() }
                                : {}),
                            }),
                          `${commandLabel(command)} applied`,
                        )
                      }
                    >
                      {commandLabel(command)}
                    </button>
                  ))}
                  <label className="hamd-pr-reason">
                    Reason (optional)
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Required for decline / clarification"
                    />
                  </label>
                </div>
              ) : null}

              {onDuplicate || onDelete ? (
                <div className="hamd-pr-actions">
                  {onDuplicate ? (
                    <button
                      type="button"
                      className="hamd-pr-btn"
                      onClick={() => onDuplicate(selected)}
                    >
                      Duplicate request
                    </button>
                  ) : null}
                  {onDelete && selected.status === "draft" ? (
                    pendingDeleteId === selected.id ? (
                      <>
                        <p className="hamd-pr-reason" role="status">
                          Delete this draft? It will be removed from your list.
                        </p>
                        <button
                          type="button"
                          className="hamd-pr-btn hamd-pr-btn--danger"
                          onClick={() => {
                            setPendingDeleteId(null);
                            void run(
                              () => onDelete(selected),
                              "Request deleted",
                            );
                          }}
                        >
                          Confirm delete
                        </button>
                        <button
                          type="button"
                          className="hamd-pr-btn"
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Keep request
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="hamd-pr-btn hamd-pr-btn--danger"
                        onClick={() => setPendingDeleteId(selected.id)}
                      >
                        Delete request
                      </button>
                    )
                  ) : null}
                </div>
              ) : null}

              <nav className="hamd-pr-tabs" aria-label="Request sections">
                {tabs
                  .filter((t) => !t.hidden)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={cx("hamd-pr-tab", tab === t.id && "is-active")}
                      aria-current={tab === t.id ? "page" : undefined}
                      onClick={() => setTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
              </nav>

              <div className="hamd-pr-panel">
                {tab === "overview" ? (
                  <div>
                    {selected.status === "draft" ? (
                      <div className="hamd-pr-autosave">
                        <p aria-live="polite">
                          Autosave:{" "}
                          {draft.saveState === "saving"
                            ? "Saving…"
                            : draft.saveState === "saved"
                              ? "Saved"
                              : draft.saveState === "dirty"
                                ? "Unsaved changes"
                                : draft.saveState === "error"
                                  ? "Error"
                                  : "Idle"}
                        </p>
                        {draft.error ? (
                          <p role="alert">{draft.error}</p>
                        ) : null}
                        <label>
                          Title
                          <input
                            value={draft.draft.title}
                            onChange={(e) =>
                              draft.update({ title: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Notes
                          <textarea
                            rows={3}
                            value={draft.draft.notes}
                            onChange={(e) =>
                              draft.update({ notes: e.target.value })
                            }
                          />
                        </label>
                        <label>
                          Destination country
                          <input
                            value={draft.draft.destinationCountryCode}
                            maxLength={2}
                            onChange={(e) =>
                              draft.update({
                                destinationCountryCode:
                                  e.target.value.toUpperCase(),
                              })
                            }
                          />
                        </label>
                        <label>
                          Destination address
                          <input
                            value={draft.draft.destinationAddress}
                            onChange={(e) =>
                              draft.update({
                                destinationAddress: e.target.value,
                              })
                            }
                          />
                        </label>
                      </div>
                    ) : (
                      <dl className="hamd-pr-facts">
                        <div>
                          <dt>Requester</dt>
                          <dd>{selected.requesterName}</dd>
                        </div>
                        <div>
                          <dt>Assignee</dt>
                          <dd>{selected.assigneeName || "Unassigned"}</dd>
                        </div>
                        <div>
                          <dt>Destination</dt>
                          <dd>
                            {selected.destinationCountryCode || "-"}
                            {selected.destinationAddress
                              ? ` · ${selected.destinationAddress}`
                              : ""}
                          </dd>
                        </div>
                        <div>
                          <dt>Budget</dt>
                          <dd>
                            {selected.budgetAmount != null
                              ? `${selected.currencyCode} ${selected.budgetAmount.toLocaleString()}`
                              : "-"}
                          </dd>
                        </div>
                        <div>
                          <dt>Notes</dt>
                          <dd>{selected.notes || "-"}</dd>
                        </div>
                      </dl>
                    )}
                    <h3>Line items</h3>
                    <ul className="hamd-pr-items">
                      {selected.items.map((item) => (
                        <li key={item.id}>
                          <strong>{item.description}</strong>
                          <span>
                            {item.quantity} {item.unit}
                            {item.targetUnitAmount != null
                              ? ` · target ${selected.currencyCode} ${item.targetUnitAmount}`
                              : ""}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {tab === "timeline" ? (
                  <ol className="hamd-pr-timeline">
                    {selected.timeline.map((event) => (
                      <li key={event.id}>
                        <time dateTime={event.createdAt}>
                          {formatWhen(event.createdAt)}
                        </time>
                        <strong>
                          {event.fromStatus
                            ? `${procurementStatusLabel(event.fromStatus)} → `
                            : ""}
                          {procurementStatusLabel(event.toStatus)}
                        </strong>
                        <span>
                          {event.command
                            ? commandLabel(event.command)
                            : "event"}
                          {event.actorName ? ` · ${event.actorName}` : ""}
                        </span>
                        {event.reason ? <em>{event.reason}</em> : null}
                      </li>
                    ))}
                  </ol>
                ) : null}

                {tab === "comments" ? (
                  <div>
                    <ul className="hamd-pr-feed">
                      {selected.comments.length === 0 ? (
                        <li className="hamd-pr-empty">No comments yet.</li>
                      ) : (
                        selected.comments.map((c) => (
                          <li key={c.id}>
                            <strong>{c.authorName}</strong>
                            <time dateTime={c.createdAt}>
                              {formatWhen(c.createdAt)}
                            </time>
                            <p>{c.body}</p>
                          </li>
                        ))
                      )}
                    </ul>
                    <form
                      className="hamd-pr-compose"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!comment.trim()) return;
                        void run(async () => {
                          await onAddComment?.(selected.id, comment.trim());
                          setComment("");
                        }, "Comment added");
                      }}
                    >
                      <label htmlFor={commentId}>Add comment</label>
                      <textarea
                        id={commentId}
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                      />
                      <button type="submit" className="hamd-pr-btn hamd-pr-btn--primary">
                        Post comment
                      </button>
                    </form>
                  </div>
                ) : null}

                {tab === "attachments" ? (
                  <div>
                    <ul className="hamd-pr-feed">
                      {selected.attachments.length === 0 ? (
                        <li className="hamd-pr-empty">No attachments.</li>
                      ) : (
                        selected.attachments.map((a) => (
                          <li key={a.id}>
                            <a
                              href={a.href}
                              onClick={(event) => {
                                if (!onOpenAttachment) return;
                                event.preventDefault();
                                void run(async () => {
                                  await onOpenAttachment(a);
                                }, "Attachment downloaded");
                              }}
                            >
                              {a.name}
                            </a>
                            <span>
                              {a.kind}
                              {a.sizeLabel ? ` · ${a.sizeLabel}` : ""}
                              {a.uploadedBy ? ` · ${a.uploadedBy}` : ""}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                    <label className="hamd-pr-btn" htmlFor={fileId}>
                      Upload attachment
                      <input
                        id={fileId}
                        type="file"
                        className="hamd-sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void run(async () => {
                            await onUploadAttachment?.(selected.id, file);
                          }, "Attachment uploaded");
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ) : null}

                {tab === "notes" && canViewInternalNotes ? (
                  <div>
                    <p className="hamd-pr-hint">
                      Internal notes are ops-only and must never appear in
                      external buyer views.
                    </p>
                    <ul className="hamd-pr-feed">
                      {selected.internalNotes.length === 0 ? (
                        <li className="hamd-pr-empty">No internal notes.</li>
                      ) : (
                        selected.internalNotes.map((n) => (
                          <li key={n.id} className="is-internal">
                            <strong>{n.authorName}</strong>
                            <time dateTime={n.createdAt}>
                              {formatWhen(n.createdAt)}
                            </time>
                            <p>{n.body}</p>
                          </li>
                        ))
                      )}
                    </ul>
                    <form
                      className="hamd-pr-compose"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!note.trim()) return;
                        void run(async () => {
                          await onAddInternalNote?.(selected.id, note.trim());
                          setNote("");
                        }, "Internal note saved");
                      }}
                    >
                      <label htmlFor={noteId}>Add internal note</label>
                      <textarea
                        id={noteId}
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        required
                      />
                      <button type="submit" className="hamd-pr-btn hamd-pr-btn--primary">
                        Save note
                      </button>
                    </form>
                  </div>
                ) : null}

                {tab === "history" ? (
                  <ol className="hamd-pr-timeline">
                    {selected.history.map((event) => (
                      <li key={`h-${event.id}`}>
                        <time dateTime={event.createdAt}>
                          {formatWhen(event.createdAt)}
                        </time>
                        <strong>
                          {procurementStatusLabel(event.toStatus)}
                        </strong>
                        <span>
                          {event.command
                            ? commandLabel(event.command)
                            : "change"}
                          {event.actorName ? ` · ${event.actorName}` : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}

                {tab === "approvals" ? (
                  <ul className="hamd-pr-feed">
                    {selected.approvals.length === 0 ? (
                      <li className="hamd-pr-empty">No approval records.</li>
                    ) : (
                      selected.approvals.map((a) => (
                        <li key={a.id}>
                          <strong>
                            {a.kind} · {a.status}
                          </strong>
                          <span>
                            {a.actorName || "Pending actor"}
                            {a.decidedAt
                              ? ` · ${formatWhen(a.decidedAt)}`
                              : ""}
                          </span>
                          {a.note ? <p>{a.note}</p> : null}
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}

                {tab === "notifications" ? (
                  <ul className="hamd-pr-feed">
                    {selected.notifications.length === 0 ? (
                      <li className="hamd-pr-empty">
                        No linked notifications.
                      </li>
                    ) : (
                      selected.notifications.map((n) => (
                        <li key={n.id} data-unread={n.unread || undefined}>
                          <strong>
                            {n.title}
                            {n.unread ? " · Unread" : ""}
                          </strong>
                          <p>{n.body}</p>
                          <time dateTime={n.createdAt}>
                            {formatWhen(n.createdAt)}
                          </time>
                        </li>
                      ))
                    )}
                  </ul>
                ) : null}

                {tab === "activity" ? (
                  <ol className="hamd-pr-activity">
                    {selected.activity.map((item) => (
                      <li key={item.id} data-type={item.type}>
                        <time dateTime={item.createdAt}>
                          {formatWhen(item.createdAt)}
                        </time>
                        <strong>{item.title}</strong>
                        <span>
                          {item.type}
                          {item.actorName ? ` · ${item.actorName}` : ""}
                        </span>
                        {item.detail ? <p>{item.detail}</p> : null}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </>
          ) : (
            <p className="hamd-pr-empty" role="status">
              Select a procurement request.
            </p>
          )}
        </section>
      </div>

      {error ? (
        <p className="hamd-pr-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
