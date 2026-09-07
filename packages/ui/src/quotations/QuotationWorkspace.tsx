import { useId, useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import { AttachmentBoard } from "../primitives/AuthenticatedMedia.js";
import { useQuotationDirectory } from "./useQuotationDirectory.js";
import {
  availableQuotationCommands,
  canReviseQuotation,
  computeQuotationTotal,
  formatMoney,
  isQuotationExpired,
  lineAmount,
  quotationCommandLabel,
  quotationStatusLabel,
  type QuotationCommand,
  type QuotationCreateInput,
  type QuotationRecord,
} from "./types.js";

export type QuotationWorkspaceTab =
  | "commercial"
  | "versions"
  | "attachments"
  | "history"
  | "negotiation"
  | "create";

export type QuotationWorkspaceProps = {
  quotations: QuotationRecord[];
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  canCreate?: boolean | undefined;
  canTransition?: boolean | undefined;
  canRevise?: boolean | undefined;
  allowedCommands?: readonly QuotationCommand[] | undefined;
  initialSelectedId?: string | null | undefined;
  compareHref?: string | undefined;
  historyHref?: string | undefined;
  onSelect?: ((quotation: QuotationRecord) => void) | undefined;
  onCreate?: ((input: QuotationCreateInput) => void | Promise<void>) | undefined;
  onTransition?: ((
    quotationId: string,
    command: QuotationCommand,
    meta: { rowVersion: number; reason?: string },
  ) => void | Promise<void>) | undefined;
  onRevise?: ((
    quotationId: string,
    meta: { rowVersion: number; reason: string },
  ) => void | Promise<void>) | undefined;
  onAddNegotiationNote?: ((
    quotationId: string,
    body: string,
  ) => void | Promise<void>) | undefined;
  onUploadAttachment?: ((
    quotationId: string,
    file: File,
  ) => void | Promise<void>) | undefined;
  onExport?: ((rows: QuotationRecord[]) => void) | undefined;
  onPrint?: ((quotation: QuotationRecord) => void) | undefined;
  onBulkDecline?: ((ids: string[]) => void | Promise<void>) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function QuotationWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-qt", "hamd-qt--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-qt-skel hamd-qt-skel--list" />
      <div className="hamd-qt-skel hamd-qt-skel--detail" />
    </div>
  );
}

/**
 * Enterprise quotation workspace - create, revise, approve/reject, versions,
 * attachments, currency/tax/discount/expiry, acceptance, negotiation.
 * Presentational; hosts wire apps/api quotation routes.
 */
export function QuotationWorkspace({
  quotations,
  title = "Quotation management",
  loading,
  className,
  canCreate = true,
  canTransition = true,
  canRevise = true,
  allowedCommands,
  initialSelectedId,
  compareHref,
  historyHref,
  onSelect,
  onCreate,
  onTransition,
  onRevise,
  onAddNegotiationNote,
  onUploadAttachment,
  onExport,
  onPrint,
  onBulkDecline,
}: QuotationWorkspaceProps) {
  const fileId = useId();
  const noteId = useId();
  const [tab, setTab] = useState<QuotationWorkspaceTab>("commercial");
  const [reason, setReason] = useState("");
  const [reviseReason, setReviseReason] = useState("");
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(Boolean(initialSelectedId));
  const [createForm, setCreateForm] = useState({
    procurementRequestId: "",
    supplierName: "",
    currencyCode: "USD",
    discountAmount: "0",
    taxAmount: "0",
    expiresAt: "",
    description: "",
    quantity: "1",
    unitAmount: "0",
    paymentTerms: "",
    commercialTerms: "",
  });

  const directory = useQuotationDirectory(quotations, { initialSelectedId });
  const selected = directory.selected;

  const totalsPreview = useMemo(() => {
    if (!selected) return null;
    return computeQuotationTotal(selected);
  }, [selected]);

  if (loading) {
    return <QuotationWorkspaceSkeleton className={className} />;
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

  const commands = selected
    ? availableQuotationCommands(String(selected.status)).filter(
        (command) => !allowedCommands || allowedCommands.includes(command),
      )
    : [];
  const expired = selected
    ? isQuotationExpired(selected.expiresAt)
    : false;

  const tabs: { id: QuotationWorkspaceTab; label: string; hidden?: boolean }[] =
    [
      { id: "commercial", label: "Commercial" },
      { id: "versions", label: "Version history" },
      { id: "attachments", label: "Attachments" },
      { id: "history", label: "Workflow history" },
      { id: "negotiation", label: "Negotiation" },
      { id: "create", label: "Create", hidden: !canCreate },
    ];

  return (
    <div
      className={cx("hamd-qt", mobileOpen && "hamd-qt--detail-open", className)}
    >
      <a className="hamd-qt__skip" href="#hamd-qt-detail">
        Skip to quotation detail
      </a>

      <header className="hamd-qt__header">
        <div>
          <h1 className="hamd-qt__title">{title}</h1>
          <p className="hamd-qt__subtitle">
            Create, revise, approve, reject, and negotiate quotations with
            versioned commercial terms
          </p>
        </div>
        <div className="hamd-qt__toolbar" role="toolbar" aria-label="Quotation actions">
          {compareHref ? (
            <a className="hamd-qt-btn hamd-qt-btn--secondary" href={compareHref}>
              Compare
            </a>
          ) : null}
          {historyHref ? (
            <a className="hamd-qt-btn hamd-qt-btn--secondary" href={historyHref}>
              History
            </a>
          ) : null}
          <button
            type="button"
            className="hamd-qt-btn hamd-qt-btn--secondary"
            onClick={() => {
              const rows =
                directory.checkedIds.length > 0
                  ? quotations.filter((row) =>
                      directory.checkedIds.includes(row.id),
                    )
                  : directory.filtered;
              onExport?.(rows);
              if (!onExport) {
                const csv = [
                  "code,version,status,supplier,total,currency",
                  ...rows.map(
                    (row) =>
                      `${row.publicCode},${row.versionNumber},${row.status},"${row.supplierName ?? ""}",${row.totalAmount},${row.currencyCode}`,
                  ),
                ].join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "quotations.csv";
                anchor.click();
                URL.revokeObjectURL(url);
              }
              setToast("Export ready.");
            }}
          >
            Export
          </button>
          <button
            type="button"
            className="hamd-qt-btn hamd-qt-btn--secondary"
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              if (onPrint) {
                onPrint(selected);
                return;
              }
              window.print();
            }}
          >
            Print
          </button>
          {onBulkDecline ? (
            <button
              type="button"
              className="hamd-qt-btn hamd-qt-btn--ghost"
              disabled={directory.checkedIds.length === 0}
              onClick={() => {
                void run(async () => {
                  await onBulkDecline(directory.checkedIds);
                  directory.clearChecked();
                }, "Bulk action submitted");
              }}
            >
              Bulk reject
            </button>
          ) : null}
        </div>
      </header>

      <div className="hamd-qt__layout">
        <aside className="hamd-qt__directory" aria-label="Quotation directory">
          <div className="hamd-qt-filters">
            <label className="hamd-sr-only" htmlFor="hamd-qt-q">
              Search quotations
            </label>
            <input
              id="hamd-qt-q"
              type="search"
              placeholder="Search code, supplier, request…"
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
                <option value="internally_reviewed">Internally reviewed</option>
                <option value="issued">Issued</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Rejected</option>
                <option value="expired">Expired</option>
                <option value="superseded">Superseded</option>
              </select>
            </label>
            <label>
              Sort
              <select
                value={`${directory.sortKey}:${directory.sortDir}`}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split(":") as [
                    "updatedAt" | "totalAmount" | "publicCode" | "status" | "expiresAt",
                    "asc" | "desc",
                  ];
                  directory.setSortKey(key);
                  directory.setSortDir(dir);
                }}
              >
                <option value="updatedAt:desc">Updated (newest)</option>
                <option value="updatedAt:asc">Updated (oldest)</option>
                <option value="totalAmount:desc">Total (high → low)</option>
                <option value="totalAmount:asc">Total (low → high)</option>
                <option value="publicCode:asc">Code (A → Z)</option>
                <option value="status:asc">Status</option>
                <option value="expiresAt:asc">Expiry (soonest)</option>
              </select>
            </label>
          </div>

          <ul
            className="hamd-qt-list"
            role="list"
            aria-label="Quotations"
            data-guide="quotation-list"
          >
            {directory.page.items.map((row, index) => {
              const active = selected?.id === row.id;
              return (
                <li key={row.id}>
                  <div className="hamd-qt-row__wrap">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.publicCode}`}
                      checked={directory.checkedIds.includes(row.id)}
                      onChange={() => directory.toggleChecked(row.id)}
                    />
                    <button
                      type="button"
                      className={cx("hamd-qt-row", active && "is-active")}
                      aria-current={active ? "true" : undefined}
                      data-guide={index === 0 ? "quotation-open" : undefined}
                      onClick={() => {
                        directory.select(row.id);
                        setMobileOpen(true);
                        setTab("commercial");
                        onSelect?.(row);
                      }}
                    >
                      <span className="hamd-qt-row__code">
                        {row.publicCode} · v{row.versionNumber}
                      </span>
                      <span className="hamd-qt-row__title">
                        {row.supplierName || "Supplier TBD"}
                      </span>
                      <span className="hamd-qt-row__meta">
                        {quotationStatusLabel(String(row.status))} ·{" "}
                        {formatMoney(row.totalAmount, row.currencyCode)}
                      </span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hamd-qt-pager" aria-label="Pagination">
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
          id="hamd-qt-detail"
          className="hamd-qt__detail"
          aria-label="Quotation detail"
        >
          {selected || tab === "create" ? (
            <>
              {selected && tab !== "create" ? (
                <header className="hamd-qt-detail__head">
                  <button
                    type="button"
                    className="hamd-qt-back"
                    onClick={() => setMobileOpen(false)}
                  >
                    Directory
                  </button>
                  <div>
                    <p className="hamd-qt-detail__code">
                      {selected.publicCode} · version {selected.versionNumber}
                    </p>
                    <h2 className="hamd-qt-detail__title">
                      {selected.supplierName || "Quotation"}
                    </h2>
                    <p className="hamd-qt-detail__sub">
                      <span
                        className="hamd-qt-pill"
                        data-status={selected.status}
                      >
                        {quotationStatusLabel(String(selected.status))}
                      </span>
                      {selected.procurementRequestCode ? (
                        <span className="hamd-qt-pill">
                          {selected.procurementRequestCode}
                        </span>
                      ) : null}
                      {expired ? (
                        <span className="hamd-qt-pill" data-status="expired">
                          Past expiry
                        </span>
                      ) : null}
                    </p>
                  </div>
                </header>
              ) : null}

              {selected && tab !== "create" && canTransition ? (
                <div
                  className="hamd-qt-actions"
                  role="group"
                  aria-label="Quotation workflow actions"
                >
                  {commands.map((command) => (
                    <button
                      key={command}
                      type="button"
                      className={cx(
                        "hamd-qt-btn",
                        (command === "issue" || command === "accept") &&
                          "hamd-qt-btn--primary",
                        command === "decline" && "hamd-qt-btn--danger",
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
                          `${quotationCommandLabel(command)} applied`,
                        )
                      }
                    >
                      {command === "review"
                        ? "Approve for issue"
                        : command === "accept"
                          ? "Accept quotation"
                          : command === "decline"
                            ? "Reject quotation"
                            : quotationCommandLabel(command)}
                    </button>
                  ))}
                  {canRevise && canReviseQuotation(String(selected.status)) ? (
                    <button
                      type="button"
                      className="hamd-qt-btn"
                      onClick={() => {
                        if (!reviseReason.trim()) {
                          setError("Revision reason is required.");
                          return;
                        }
                        void run(
                          () =>
                            onRevise?.(selected.id, {
                              rowVersion: selected.rowVersion,
                              reason: reviseReason.trim(),
                            }),
                          "Revision started",
                        );
                      }}
                    >
                      Create revision
                    </button>
                  ) : null}
                  <label className="hamd-qt-reason">
                    Decision reason
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Required for rejection"
                    />
                  </label>
                  {canRevise && canReviseQuotation(String(selected.status)) ? (
                    <label className="hamd-qt-reason">
                      Revision reason
                      <input
                        value={reviseReason}
                        onChange={(e) => setReviseReason(e.target.value)}
                        placeholder="Why revise?"
                      />
                    </label>
                  ) : null}
                </div>
              ) : null}

              <nav className="hamd-qt-tabs" aria-label="Quotation sections">
                {tabs
                  .filter((t) => !t.hidden)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={cx("hamd-qt-tab", tab === t.id && "is-active")}
                      aria-current={tab === t.id ? "page" : undefined}
                      onClick={() => setTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
              </nav>

              <div className="hamd-qt-panel">
                {tab === "commercial" && selected ? (
                  <div>
                    <div className="hamd-qt-money">
                      <div>
                        <span>Currency</span>
                        <strong>{selected.currencyCode}</strong>
                      </div>
                      <div>
                        <span>Subtotal</span>
                        <strong>
                          {formatMoney(
                            selected.subtotalAmount,
                            selected.currencyCode,
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>Discount</span>
                        <strong>
                          −
                          {formatMoney(
                            selected.discountAmount,
                            selected.currencyCode,
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>Taxes</span>
                        <strong>
                          {formatMoney(
                            selected.taxAmount,
                            selected.currencyCode,
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>Total</span>
                        <strong>
                          {formatMoney(
                            totalsPreview ?? selected.totalAmount,
                            selected.currencyCode,
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>Expiry</span>
                        <strong>
                          {selected.expiresAt
                            ? new Date(selected.expiresAt).toLocaleString()
                            : "None"}
                        </strong>
                      </div>
                    </div>

                    <dl className="hamd-qt-facts">
                      <div>
                        <dt>Lead time</dt>
                        <dd>
                          {selected.deliveryLeadTimeDays != null
                            ? `${selected.deliveryLeadTimeDays} days`
                            : "-"}
                        </dd>
                      </div>
                      <div>
                        <dt>MOQ</dt>
                        <dd>{selected.minimumOrderQuantity ?? "-"}</dd>
                      </div>
                      <div>
                        <dt>Payment terms</dt>
                        <dd>{selected.paymentTerms || "-"}</dd>
                      </div>
                      <div>
                        <dt>Commercial terms</dt>
                        <dd>{selected.commercialTerms || "-"}</dd>
                      </div>
                      <div>
                        <dt>Warranty</dt>
                        <dd>
                          {selected.commercialTerms?.toLowerCase().includes(
                            "warrant",
                          )
                            ? selected.commercialTerms
                            : "Covered in commercial terms when specified"}
                        </dd>
                      </div>
                      <div>
                        <dt>Approval status</dt>
                        <dd>
                          {quotationStatusLabel(String(selected.status))}
                        </dd>
                      </div>
                      <div>
                        <dt>Supplier</dt>
                        <dd>{selected.supplierName || "Supplier TBD"}</dd>
                      </div>
                      <div>
                        <dt>Shipping / duty / other</dt>
                        <dd>
                          {formatMoney(
                            selected.shippingAmount,
                            selected.currencyCode,
                          )}{" "}
                          /{" "}
                          {formatMoney(
                            selected.dutyAmount,
                            selected.currencyCode,
                          )}{" "}
                          /{" "}
                          {formatMoney(
                            selected.otherAmount,
                            selected.currencyCode,
                          )}
                        </dd>
                      </div>
                    </dl>

                    <h3>Line items</h3>
                    <ul className="hamd-qt-items">
                      {selected.items.map((item) => (
                        <li key={item.id}>
                          <strong>{item.description}</strong>
                          <span>
                            {item.quantity} ×{" "}
                            {formatMoney(item.unitAmount, selected.currencyCode)}{" "}
                            ={" "}
                            {formatMoney(
                              item.lineAmount ||
                                lineAmount(item.quantity, item.unitAmount),
                              selected.currencyCode,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {tab === "versions" && selected ? (
                  <ol className="hamd-qt-versions">
                    {selected.versions.map((v) => (
                      <li
                        key={v.id}
                        className={cx(v.current && "is-current")}
                      >
                        <strong>
                          v{v.versionNumber} · {v.publicCode}
                          {v.current ? " · Current" : ""}
                        </strong>
                        <span>
                          {quotationStatusLabel(String(v.status))} ·{" "}
                          {formatMoney(v.totalAmount, selected.currencyCode)}
                        </span>
                        <time dateTime={v.createdAt}>
                          {formatWhen(v.createdAt)}
                        </time>
                      </li>
                    ))}
                  </ol>
                ) : null}

                {tab === "attachments" && selected ? (
                  <div>
                    <AttachmentBoard
                      files={selected.attachments.map((a) => ({
                        id: a.id,
                        name: a.name,
                        href: a.href,
                        kind: a.kind,
                        uploadedAt: a.uploadedAt,
                      }))}
                      emptyLabel="No attachments."
                    />
                    {onUploadAttachment ? (
                      <label className="hamd-qt-btn" htmlFor={fileId}>
                        Upload attachment
                        <input
                          id={fileId}
                          type="file"
                          className="hamd-sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            void run(async () => {
                              await onUploadAttachment(selected.id, file);
                            }, "Attachment uploaded");
                            e.target.value = "";
                          }}
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}

                {tab === "history" && selected ? (
                  <ol className="hamd-qt-history">
                    {selected.history.map((event) => (
                      <li key={event.id}>
                        <time dateTime={event.createdAt}>
                          {formatWhen(event.createdAt)}
                        </time>
                        <strong>
                          {event.fromStatus
                            ? `${quotationStatusLabel(event.fromStatus)} → `
                            : ""}
                          {quotationStatusLabel(event.toStatus)}
                        </strong>
                        <span>
                          {quotationCommandLabel(event.command)}
                          {event.actorName ? ` · ${event.actorName}` : ""}
                        </span>
                        {event.reason ? <em>{event.reason}</em> : null}
                      </li>
                    ))}
                  </ol>
                ) : null}

                {tab === "negotiation" && selected ? (
                  <div>
                    <ul className="hamd-qt-feed">
                      {selected.negotiation.length === 0 ? (
                        <li className="hamd-qt-empty">
                          No negotiation notes yet.
                        </li>
                      ) : (
                        selected.negotiation.map((n) => (
                          <li key={n.id} data-kind={n.kind}>
                            <strong>
                              {n.authorName}
                              {n.kind ? ` · ${n.kind}` : ""}
                            </strong>
                            <time dateTime={n.createdAt}>
                              {formatWhen(n.createdAt)}
                            </time>
                            <p>{n.body}</p>
                          </li>
                        ))
                      )}
                    </ul>
                    {onAddNegotiationNote ? (
                      <form
                        className="hamd-qt-compose"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!note.trim()) return;
                          void run(async () => {
                            await onAddNegotiationNote(
                              selected.id,
                              note.trim(),
                            );
                            setNote("");
                          }, "Negotiation note added");
                        }}
                      >
                        <label htmlFor={noteId}>Add negotiation note</label>
                        <textarea
                          id={noteId}
                          rows={3}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          required
                        />
                        <button
                          type="submit"
                          className="hamd-qt-btn hamd-qt-btn--primary"
                        >
                          Post note
                        </button>
                      </form>
                    ) : null}
                  </div>
                ) : null}

                {tab === "create" && canCreate ? (
                  <form
                    className="hamd-qt-create"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const quantity = Number(createForm.quantity);
                      const unitAmount = Number(createForm.unitAmount);
                      const discountAmount = Number(createForm.discountAmount);
                      const taxAmount = Number(createForm.taxAmount);
                      void run(async () => {
                        await onCreate?.({
                          procurementRequestId:
                            createForm.procurementRequestId.trim(),
                          currencyCode: createForm.currencyCode.toUpperCase(),
                          discountAmount,
                          taxAmount,
                          expiresAt: createForm.expiresAt || null,
                          paymentTerms: createForm.paymentTerms || undefined,
                          commercialTerms:
                            createForm.commercialTerms || undefined,
                          items: [
                            {
                              description: createForm.description.trim(),
                              quantity,
                              unitAmount,
                            },
                          ],
                        });
                      }, "Quotation created");
                    }}
                  >
                    <h2>Create quotation</h2>
                    <label>
                      Procurement request ID
                      <input
                        required
                        value={createForm.procurementRequestId}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            procurementRequestId: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Currency
                      <input
                        required
                        maxLength={3}
                        value={createForm.currencyCode}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            currencyCode: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                    </label>
                    <label>
                      Expiry
                      <input
                        type="datetime-local"
                        value={createForm.expiresAt}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            expiresAt: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Discount
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={createForm.discountAmount}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            discountAmount: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Taxes
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={createForm.taxAmount}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            taxAmount: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Line description
                      <input
                        required
                        value={createForm.description}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Quantity
                      <input
                        type="number"
                        min={0.0001}
                        step="any"
                        required
                        value={createForm.quantity}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Unit amount
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        value={createForm.unitAmount}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            unitAmount: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Payment terms
                      <input
                        value={createForm.paymentTerms}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            paymentTerms: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Commercial / negotiation terms
                      <textarea
                        rows={3}
                        value={createForm.commercialTerms}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            commercialTerms: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <button
                      type="submit"
                      className="hamd-qt-btn hamd-qt-btn--primary"
                    >
                      Create draft quotation
                    </button>
                  </form>
                ) : null}
              </div>
            </>
          ) : (
            <p className="hamd-qt-empty" role="status">
              Select a quotation or create a new draft.
            </p>
          )}
        </section>
      </div>

      {error ? (
        <p className="hamd-qt-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
