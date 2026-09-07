import { useId, useState } from "react";
import { cx } from "../utils/cx.js";
import { formatMoney } from "../quotations/types.js";
import { usePurchaseOrderDirectory } from "./usePurchaseOrderDirectory.js";
import {
  availablePurchaseOrderCommands,
  purchaseOrderCommandLabel,
  purchaseOrderStatusLabel,
  supplierAcceptanceLabel,
  type PurchaseOrderCommand,
  type PurchaseOrderCreateInput,
  type PurchaseOrderRecord,
} from "./types.js";

export type PurchaseOrderWorkspaceTab =
  | "overview"
  | "history"
  | "documents"
  | "attachments"
  | "revisions"
  | "delivery"
  | "create";

export type PurchaseOrderWorkspaceProps = {
  orders: PurchaseOrderRecord[];
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  canCreate?: boolean | undefined;
  canTransition?: boolean | undefined;
  onSelect?: ((order: PurchaseOrderRecord) => void) | undefined;
  onCreate?: ((input: PurchaseOrderCreateInput) => void | Promise<void>) | undefined;
  onTransition?: ((
    orderId: string,
    command: PurchaseOrderCommand,
    meta: { rowVersion: number; reason?: string },
  ) => void | Promise<void>) | undefined;
  onUploadDocument?: ((
    orderId: string,
    file: File,
  ) => void | Promise<void>) | undefined;
  onUploadAttachment?: ((
    orderId: string,
    file: File,
  ) => void | Promise<void>) | undefined;
  onOpenDelivery?: ((href: string) => void) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function PurchaseOrderWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-po", "hamd-po--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-po-skel hamd-po-skel--list" />
      <div className="hamd-po-skel hamd-po-skel--detail" />
    </div>
  );
}

/**
 * Enterprise purchase order workspace.
 * KEEP Prisma statuses; supplier acceptance + delivery tracking are workflow
 * surfaces for hosts (PO API is currently created via quotation accept).
 */
export function PurchaseOrderWorkspace({
  orders,
  title = "Purchase orders",
  loading,
  className,
  canCreate = true,
  canTransition = true,
  onSelect,
  onCreate,
  onTransition,
  onUploadDocument,
  onUploadAttachment,
  onOpenDelivery,
}: PurchaseOrderWorkspaceProps) {
  const docId = useId();
  const attId = useId();
  const [tab, setTab] = useState<PurchaseOrderWorkspaceTab>("overview");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    procurementRequestId: "",
    quotationId: "",
    currencyCode: "USD",
    description: "",
    quantity: "1",
    unitAmount: "0",
  });

  const directory = usePurchaseOrderDirectory(orders);
  const selected = directory.selected;

  if (loading) {
    return <PurchaseOrderWorkspaceSkeleton className={className} />;
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
    ? availablePurchaseOrderCommands(
        String(selected.status),
        String(selected.supplierAcceptance),
      )
    : [];

  const tabs: {
    id: PurchaseOrderWorkspaceTab;
    label: string;
    hidden?: boolean;
  }[] = [
    { id: "overview", label: "Status" },
    { id: "history", label: "History" },
    { id: "documents", label: "Documents" },
    { id: "attachments", label: "Attachments" },
    { id: "revisions", label: "Revision" },
    { id: "delivery", label: "Delivery tracking" },
    { id: "create", label: "Creation", hidden: !canCreate },
  ];

  return (
    <div
      className={cx("hamd-po", mobileOpen && "hamd-po--detail-open", className)}
    >
      <a className="hamd-po__skip" href="#hamd-po-detail">
        Skip to purchase order detail
      </a>

      <header className="hamd-po__header">
        <div>
          <h1 className="hamd-po__title">{title}</h1>
          <p className="hamd-po__subtitle">
            Creation, approval, supplier acceptance, revisions, documents, and
            delivery tracking
          </p>
        </div>
      </header>

      <div className="hamd-po__layout">
        <aside className="hamd-po__directory" aria-label="Purchase order directory">
          <div className="hamd-po-filters">
            <label className="hamd-sr-only" htmlFor="hamd-po-q">
              Search purchase orders
            </label>
            <input
              id="hamd-po-q"
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
                <option value="issued">Issued</option>
                <option value="partially_fulfilled">Partially fulfilled</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>

          <ul className="hamd-po-list" role="list" aria-label="Purchase orders">
            {directory.page.items.map((row) => {
              const active = selected?.id === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={cx("hamd-po-row", active && "is-active")}
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      directory.select(row.id);
                      setMobileOpen(true);
                      setTab("overview");
                      onSelect?.(row);
                    }}
                  >
                    <span className="hamd-po-row__code">
                      {row.publicCode} · v{row.versionNumber}
                    </span>
                    <span className="hamd-po-row__title">
                      {row.supplierName || "Supplier TBD"}
                    </span>
                    <span className="hamd-po-row__meta">
                      {purchaseOrderStatusLabel(String(row.status))} ·{" "}
                      {formatMoney(row.totalAmount, row.currencyCode)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hamd-po-pager" aria-label="Pagination">
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
          id="hamd-po-detail"
          className="hamd-po__detail"
          aria-label="Purchase order detail"
        >
          {selected || tab === "create" ? (
            <>
              {selected && tab !== "create" ? (
                <header className="hamd-po-detail__head">
                  <button
                    type="button"
                    className="hamd-po-back"
                    onClick={() => setMobileOpen(false)}
                  >
                    Directory
                  </button>
                  <div>
                    <p className="hamd-po-detail__code">
                      {selected.publicCode} · version {selected.versionNumber}
                    </p>
                    <h2 className="hamd-po-detail__title">
                      {selected.supplierName || "Purchase order"}
                    </h2>
                    <p className="hamd-po-detail__sub">
                      <span className="hamd-po-pill" data-status={selected.status}>
                        {purchaseOrderStatusLabel(String(selected.status))}
                      </span>
                      <span
                        className="hamd-po-pill"
                        data-acceptance={selected.supplierAcceptance}
                      >
                        {supplierAcceptanceLabel(
                          String(selected.supplierAcceptance),
                        )}
                      </span>
                      {selected.procurementRequestCode ? (
                        <span className="hamd-po-pill">
                          {selected.procurementRequestCode}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </header>
              ) : null}

              {selected && tab !== "create" && canTransition && commands.length ? (
                <div
                  className="hamd-po-actions"
                  role="group"
                  aria-label="Purchase order workflow actions"
                >
                  {commands.map((command) => (
                    <button
                      key={command}
                      type="button"
                      className={cx(
                        "hamd-po-btn",
                        (command === "approve" ||
                          command === "issue" ||
                          command === "supplier_accept") &&
                          "hamd-po-btn--primary",
                        (command === "cancel" ||
                          command === "supplier_reject") &&
                          "hamd-po-btn--danger",
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
                          `${purchaseOrderCommandLabel(command)} applied`,
                        )
                      }
                    >
                      {purchaseOrderCommandLabel(command)}
                    </button>
                  ))}
                  <label className="hamd-po-reason">
                    Reason
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Required for cancel / rejection"
                    />
                  </label>
                </div>
              ) : null}

              <nav className="hamd-po-tabs" aria-label="Purchase order sections">
                {tabs
                  .filter((t) => !t.hidden)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={cx("hamd-po-tab", tab === t.id && "is-active")}
                      aria-current={tab === t.id ? "page" : undefined}
                      onClick={() => setTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
              </nav>

              <div className="hamd-po-panel">
                {tab === "overview" && selected ? (
                  <div>
                    <dl className="hamd-po-facts">
                      <div>
                        <dt>Status</dt>
                        <dd>
                          {purchaseOrderStatusLabel(String(selected.status))}
                        </dd>
                      </div>
                      <div>
                        <dt>Supplier acceptance</dt>
                        <dd>
                          {supplierAcceptanceLabel(
                            String(selected.supplierAcceptance),
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Total</dt>
                        <dd>
                          {formatMoney(
                            selected.totalAmount,
                            selected.currencyCode,
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Quotation</dt>
                        <dd>{selected.quotationCode || "-"}</dd>
                      </div>
                      <div>
                        <dt>Request</dt>
                        <dd>{selected.procurementRequestCode || "-"}</dd>
                      </div>
                      <div>
                        <dt>Updated</dt>
                        <dd>{formatWhen(selected.updatedAt)}</dd>
                      </div>
                    </dl>
                    <h3>Line items</h3>
                    <ul className="hamd-po-items">
                      {selected.items.map((item) => (
                        <li key={item.id}>
                          <strong>{item.description}</strong>
                          <span>
                            {item.quantity} ×{" "}
                            {formatMoney(item.unitAmount, selected.currencyCode)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {tab === "history" && selected ? (
                  <ol className="hamd-po-history">
                    {selected.history.map((event) => (
                      <li key={event.id}>
                        <time dateTime={event.createdAt}>
                          {formatWhen(event.createdAt)}
                        </time>
                        <strong>
                          {event.fromStatus
                            ? `${purchaseOrderStatusLabel(event.fromStatus)} → `
                            : ""}
                          {purchaseOrderStatusLabel(event.toStatus)}
                        </strong>
                        <span>
                          {purchaseOrderCommandLabel(event.command)}
                          {event.actorName ? ` · ${event.actorName}` : ""}
                        </span>
                        {event.reason ? <em>{event.reason}</em> : null}
                      </li>
                    ))}
                  </ol>
                ) : null}

                {tab === "documents" && selected ? (
                  <div>
                    <ul className="hamd-po-feed">
                      {selected.documents.length === 0 ? (
                        <li className="hamd-po-empty">No documents.</li>
                      ) : (
                        selected.documents.map((doc) => (
                          <li key={doc.id}>
                            <a href={doc.href}>{doc.name}</a>
                            <span>
                              {doc.kind || "document"} ·{" "}
                              {formatWhen(doc.uploadedAt)}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                    <label className="hamd-po-btn" htmlFor={docId}>
                      Upload document
                      <input
                        id={docId}
                        type="file"
                        className="hamd-sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void run(async () => {
                            await onUploadDocument?.(selected.id, file);
                          }, "Document uploaded");
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                ) : null}

                {tab === "attachments" && selected ? (
                  <div>
                    <ul className="hamd-po-feed">
                      {selected.attachments.length === 0 ? (
                        <li className="hamd-po-empty">No attachments.</li>
                      ) : (
                        selected.attachments.map((doc) => (
                          <li key={doc.id}>
                            <a href={doc.href}>{doc.name}</a>
                            <span>{formatWhen(doc.uploadedAt)}</span>
                          </li>
                        ))
                      )}
                    </ul>
                    <label className="hamd-po-btn" htmlFor={attId}>
                      Upload attachment
                      <input
                        id={attId}
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

                {tab === "revisions" && selected ? (
                  <ol className="hamd-po-versions">
                    {selected.revisions.map((rev) => (
                      <li
                        key={rev.id}
                        className={cx(rev.current && "is-current")}
                      >
                        <strong>
                          v{rev.versionNumber} · {rev.publicCode}
                          {rev.current ? " · Current" : ""}
                        </strong>
                        <span>
                          {purchaseOrderStatusLabel(String(rev.status))} ·{" "}
                          {formatMoney(rev.totalAmount, selected.currencyCode)}
                        </span>
                        {rev.note ? <em>{rev.note}</em> : null}
                        <time dateTime={rev.createdAt}>
                          {formatWhen(rev.createdAt)}
                        </time>
                      </li>
                    ))}
                  </ol>
                ) : null}

                {tab === "delivery" && selected ? (
                  <div>
                    {selected.deliveries.length === 0 ? (
                      <p className="hamd-po-empty">
                        No shipments linked for delivery tracking.
                      </p>
                    ) : (
                      <ul className="hamd-po-deliveries">
                        {selected.deliveries.map((shipment) => (
                          <li key={shipment.shipmentId}>
                            <button
                              type="button"
                              className="hamd-po-linkish"
                              onClick={() =>
                                shipment.href
                                  ? onOpenDelivery?.(shipment.href)
                                  : undefined
                              }
                            >
                              <strong>
                                {shipment.publicCode} ·{" "}
                                {purchaseOrderStatusLabel(shipment.status)}
                              </strong>
                            </button>
                            <span>
                              {[shipment.carrierName, shipment.trackingNumber]
                                .filter(Boolean)
                                .join(" · ") || "Carrier TBD"}
                            </span>
                            <span>
                              ETA{" "}
                              {shipment.estimatedArrivalAt
                                ? formatWhen(shipment.estimatedArrivalAt)
                                : "-"}
                            </span>
                            <ol className="hamd-po-milestones">
                              {shipment.milestones.map((m) => (
                                <li key={m.id}>
                                  <strong>{m.label}</strong>
                                  <span>
                                    {m.status}
                                    {m.occurredAt
                                      ? ` · ${formatWhen(m.occurredAt)}`
                                      : m.estimatedAt
                                        ? ` · est. ${formatWhen(m.estimatedAt)}`
                                        : ""}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}

                {tab === "create" && canCreate ? (
                  <form
                    className="hamd-po-create"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(async () => {
                        await onCreate?.({
                          procurementRequestId:
                            createForm.procurementRequestId.trim(),
                          ...(createForm.quotationId.trim()
                            ? { quotationId: createForm.quotationId.trim() }
                            : {}),
                          currencyCode: createForm.currencyCode.toUpperCase(),
                          items: [
                            {
                              description: createForm.description.trim(),
                              quantity: Number(createForm.quantity),
                              unitAmount: Number(createForm.unitAmount),
                            },
                          ],
                        });
                      }, "Purchase order created");
                    }}
                  >
                    <h2>Create purchase order</h2>
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
                      Quotation ID (optional)
                      <input
                        value={createForm.quotationId}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            quotationId: e.target.value,
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
                    <button
                      type="submit"
                      className="hamd-po-btn hamd-po-btn--primary"
                    >
                      Create draft PO
                    </button>
                  </form>
                ) : null}
              </div>
            </>
          ) : (
            <p className="hamd-po-empty" role="status">
              Select a purchase order or create a draft.
            </p>
          )}
        </section>
      </div>

      {error ? (
        <p className="hamd-po-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
