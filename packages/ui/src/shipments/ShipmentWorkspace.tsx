import { useId, useMemo, useState, type ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { AttachmentBoard } from "../primitives/AuthenticatedMedia.js";
import { useShipmentDirectory } from "./useShipmentDirectory.js";
import { useShipmentMapSlot } from "./useShipmentMapSlot.js";
import {
  availableShipmentCommands,
  milestoneConfidenceLabel,
  shipmentCommandLabel,
  shipmentStatusLabel,
  type ShipmentCommand,
  type ShipmentConfirmDeliveryInput,
  type ShipmentCreateInput,
  type ShipmentMapAdapter,
  type ShipmentRecord,
} from "./types.js";

export type ShipmentWorkspaceTab =
  | "overview"
  | "tracking"
  | "milestones"
  | "timeline"
  | "documents"
  | "proof"
  | "history"
  | "map"
  | "create";

export type ShipmentWorkspaceProps = {
  shipments: ShipmentRecord[];
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  initialSelectedId?: string | null | undefined;
  canCreate?: boolean | undefined;
  canTransition?: boolean | undefined;
  canConfirmDelivery?: boolean | undefined;
  onSelect?: ((shipment: ShipmentRecord) => void) | undefined;
  onCreate?: ((input: ShipmentCreateInput) => void | Promise<void>) | undefined;
  onTransition?: ((
    shipmentId: string,
    command: ShipmentCommand,
    meta: { rowVersion: number; reason?: string },
  ) => void | Promise<void>) | undefined;
  onUploadDocument?: ((
    shipmentId: string,
    file: File,
  ) => void | Promise<void>) | undefined;
  onConfirmDelivery?: ((
    shipmentId: string,
    input: ShipmentConfirmDeliveryInput,
    meta: { rowVersion: number },
  ) => void | Promise<void>) | undefined;
  onRefreshTracking?: ((shipmentId: string) => void | Promise<void>) | undefined;
  /**
   * Optional real map provider adapter. When absent, the Map tab shows an
   * honest placeholder (no fake map tiles).
   */
  mapAdapter?: ShipmentMapAdapter | null | undefined;
  /** Alternate render prop for hosts that prefer inline composition. */
  renderMap?: ((context: {
    shipment: ShipmentRecord;
  }) => ReactNode) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function ShipmentWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-sh", "hamd-sh--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-sh-skel hamd-sh-skel--list" />
      <div className="hamd-sh-skel hamd-sh-skel--detail" />
    </div>
  );
}

/**
 * Enterprise logistics / shipment workspace.
 * KEEP Prisma ShipmentStatus + lifecycle commands; hosts inject API handlers.
 */
export function ShipmentWorkspace({
  shipments,
  title = "Logistics",
  loading,
  className,
  initialSelectedId,
  canCreate = true,
  canTransition = true,
  canConfirmDelivery = true,
  onSelect,
  onCreate,
  onTransition,
  onUploadDocument,
  onConfirmDelivery,
  onRefreshTracking,
  mapAdapter = null,
  renderMap,
}: ShipmentWorkspaceProps) {
  const docId = useId();
  const [tab, setTab] = useState<ShipmentWorkspaceTab>("overview");
  const [reason, setReason] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(Boolean(initialSelectedId));
  const [podForm, setPodForm] = useState({
    recipientName: "",
    notes: "",
    evidenceDocumentIds: [] as string[],
  });
  const [createForm, setCreateForm] = useState({
    purchaseOrderId: "",
    carrierName: "",
    trackingNumber: "",
    transportMode: "ocean",
    estimatedArrivalAt: "",
    originLabel: "",
    destinationLabel: "",
  });

  const directory = useShipmentDirectory(shipments, { initialSelectedId });
  const selected = directory.selected;

  const mapContext = useMemo(
    () => (selected ? { shipment: selected, map: selected.map } : null),
    [selected],
  );
  const adaptedMap = useShipmentMapSlot(mapAdapter, mapContext);

  if (loading) {
    return <ShipmentWorkspaceSkeleton className={className} />;
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
    ? availableShipmentCommands(String(selected.status))
    : [];

  const tabs: {
    id: ShipmentWorkspaceTab;
    label: string;
    hidden?: boolean;
  }[] = [
    { id: "overview", label: "Shipment" },
    { id: "tracking", label: "Tracking" },
    { id: "milestones", label: "Milestones" },
    { id: "timeline", label: "Timeline" },
    { id: "documents", label: "Documents" },
    { id: "proof", label: "Proof of delivery" },
    { id: "history", label: "History" },
    { id: "map", label: "Map" },
    { id: "create", label: "Create", hidden: !canCreate },
  ];

  return (
    <div
      className={cx("hamd-sh", mobileOpen && "hamd-sh--detail-open", className)}
    >
      <a className="hamd-sh__skip" href="#hamd-sh-detail">
        Skip to shipment detail
      </a>

      <header className="hamd-sh__header">
        <div>
          <h1 className="hamd-sh__title">{title}</h1>
          <p className="hamd-sh__subtitle">
            Shipments, tracking, milestones, ETA, carriers, documents, proof of
            delivery, timeline, and history
          </p>
        </div>
      </header>

      <div className="hamd-sh__layout">
        <aside className="hamd-sh__directory" aria-label="Shipment directory">
          <div className="hamd-sh-filters">
            <label className="hamd-sr-only" htmlFor="hamd-sh-q">
              Search shipments
            </label>
            <input
              id="hamd-sh-q"
              type="search"
              placeholder="Search code, PO, carrier, tracking…"
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
                <option value="planned">Planned</option>
                <option value="departed">Departed</option>
                <option value="out_for_delivery">Out for delivery</option>
                <option value="delivered">Delivered</option>
                <option value="held">Held</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </label>
          </div>

          <ul
            className="hamd-sh-list"
            role="list"
            aria-label="Shipments"
            data-guide="shipment-list"
          >
            {directory.page.items.map((row) => {
              const active = selected?.id === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={cx("hamd-sh-row", active && "is-active")}
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      directory.select(row.id);
                      setMobileOpen(true);
                      setTab("overview");
                      onSelect?.(row);
                    }}
                  >
                    <span className="hamd-sh-row__code">{row.publicCode}</span>
                    <span className="hamd-sh-row__title">
                      {row.carrierName || "Carrier TBD"}
                      {row.purchaseOrderCode
                        ? ` · ${row.purchaseOrderCode}`
                        : ""}
                    </span>
                    <span className="hamd-sh-row__meta">
                      {shipmentStatusLabel(String(row.status))}
                      {row.estimatedArrivalAt
                        ? ` · ETA ${formatWhen(row.estimatedArrivalAt)}`
                        : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hamd-sh-pager" aria-label="Pagination">
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
          id="hamd-sh-detail"
          className="hamd-sh__detail"
          aria-label="Shipment detail"
        >
          {selected || tab === "create" ? (
            <>
              {selected && tab !== "create" ? (
                <header className="hamd-sh-detail__head">
                  <button
                    type="button"
                    className="hamd-sh-back"
                    onClick={() => setMobileOpen(false)}
                  >
                    Directory
                  </button>
                  <div>
                    <p className="hamd-sh-detail__code">{selected.publicCode}</p>
                    <h2 className="hamd-sh-detail__title">
                      {selected.carrierName || "Shipment"}
                      {selected.trackingNumber
                        ? ` · ${selected.trackingNumber}`
                        : ""}
                    </h2>
                    <p className="hamd-sh-detail__sub">
                      <span
                        className="hamd-sh-pill"
                        data-status={selected.status}
                      >
                        {shipmentStatusLabel(String(selected.status))}
                      </span>
                      {selected.purchaseOrderCode ? (
                        <span className="hamd-sh-pill">
                          {selected.purchaseOrderCode}
                        </span>
                      ) : null}
                      {selected.transportMode ? (
                        <span className="hamd-sh-pill">
                          {selected.transportMode}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </header>
              ) : null}

              {selected && tab !== "create" && canTransition && commands.length ? (
                <div
                  className="hamd-sh-actions"
                  role="group"
                  aria-label="Shipment workflow actions"
                >
                  {commands.map((command) => (
                    <button
                      key={command}
                      type="button"
                      className={cx(
                        "hamd-sh-btn",
                        (command === "deliver" ||
                          command === "complete" ||
                          command === "depart") &&
                          "hamd-sh-btn--primary",
                        (command === "cancel" || command === "hold") &&
                          "hamd-sh-btn--danger",
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
                          `${shipmentCommandLabel(command)} applied`,
                        )
                      }
                    >
                      {shipmentCommandLabel(command)}
                    </button>
                  ))}
                  <label className="hamd-sh-reason">
                    Reason
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Required for hold / cancel"
                    />
                  </label>
                </div>
              ) : null}

              <nav className="hamd-sh-tabs" aria-label="Shipment sections">
                {tabs
                  .filter((t) => !t.hidden)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={cx("hamd-sh-tab", tab === t.id && "is-active")}
                      aria-current={tab === t.id ? "page" : undefined}
                      data-guide={t.id === "tracking" ? "shipment-track" : undefined}
                      onClick={() => setTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
              </nav>

              <div className="hamd-sh-panel">
                {tab === "overview" && selected ? (
                  <div>
                    <dl className="hamd-sh-facts">
                      <div>
                        <dt>Status</dt>
                        <dd>
                          {shipmentStatusLabel(String(selected.status))}
                        </dd>
                      </div>
                      <div>
                        <dt>Carrier</dt>
                        <dd>{selected.carrierName || "-"}</dd>
                      </div>
                      <div>
                        <dt>ETA</dt>
                        <dd>
                          {selected.estimatedArrivalAt
                            ? formatWhen(selected.estimatedArrivalAt)
                            : "-"}
                        </dd>
                      </div>
                      <div>
                        <dt>Actual delivery</dt>
                        <dd>
                          {selected.actualDeliveryAt
                            ? formatWhen(selected.actualDeliveryAt)
                            : "-"}
                        </dd>
                      </div>
                      <div>
                        <dt>Origin</dt>
                        <dd>{selected.originLabel || "-"}</dd>
                      </div>
                      <div>
                        <dt>Destination</dt>
                        <dd>{selected.destinationLabel || "-"}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null}

                {tab === "tracking" && selected ? (
                  <div>
                    <dl className="hamd-sh-facts">
                      <div>
                        <dt>Carrier</dt>
                        <dd>{selected.carrierName || "-"}</dd>
                      </div>
                      <div>
                        <dt>Tracking number</dt>
                        <dd>{selected.trackingNumber || "Not assigned"}</dd>
                      </div>
                      <div>
                        <dt>Mode</dt>
                        <dd>{selected.transportMode || "-"}</dd>
                      </div>
                      <div>
                        <dt>ETA</dt>
                        <dd>
                          {selected.estimatedArrivalAt
                            ? formatWhen(selected.estimatedArrivalAt)
                            : "-"}
                        </dd>
                      </div>
                    </dl>
                    {onRefreshTracking ? (
                      <button
                        type="button"
                        className="hamd-sh-btn hamd-sh-btn--primary"
                        onClick={() =>
                          void run(
                            () => onRefreshTracking(selected.id),
                            "Tracking refreshed",
                          )
                        }
                      >
                        Refresh carrier tracking
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {tab === "milestones" && selected ? (
                  <ol className="hamd-sh-milestones" aria-label="Milestones">
                    {selected.milestones.length === 0 ? (
                      <li className="hamd-sh-empty">No milestones.</li>
                    ) : (
                      selected.milestones.map((m) => (
                        <li key={m.id}>
                          <strong>{m.label}</strong>
                          <span>
                            {milestoneConfidenceLabel(String(m.confidence))}
                            {m.location ? ` · ${m.location}` : ""}
                            {m.occurredAt
                              ? ` · ${formatWhen(m.occurredAt)}`
                              : m.estimatedAt
                                ? ` · est. ${formatWhen(m.estimatedAt)}`
                                : ""}
                          </span>
                        </li>
                      ))
                    )}
                  </ol>
                ) : null}

                {tab === "timeline" && selected ? (
                  <ol className="hamd-sh-timeline" aria-label="Shipment timeline">
                    {selected.timeline.length === 0 ? (
                      <li className="hamd-sh-empty">No timeline events.</li>
                    ) : (
                      selected.timeline.map((event) => (
                        <li key={event.id} data-kind={event.kind}>
                          <time dateTime={event.at}>
                            {formatWhen(event.at)}
                          </time>
                          <strong>{event.label}</strong>
                          {event.detail ? <span>{event.detail}</span> : null}
                        </li>
                      ))
                    )}
                  </ol>
                ) : null}

                {tab === "documents" && selected ? (
                  <div>
                    <AttachmentBoard
                      files={selected.documents.map((doc) => ({
                        id: doc.id,
                        name: doc.name,
                        href: doc.href,
                        kind: doc.role || "document",
                        uploadedAt: doc.uploadedAt,
                      }))}
                      emptyLabel="No documents."
                    />
                    <label className="hamd-sh-btn" htmlFor={docId}>
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

                {tab === "proof" && selected ? (
                  <div className="hamd-sh-pod">
                    {selected.proofOfDelivery.confirmed ? (
                      <dl className="hamd-sh-facts">
                        <div>
                          <dt>Status</dt>
                          <dd>Confirmed</dd>
                        </div>
                        <div>
                          <dt>Recipient</dt>
                          <dd>
                            {selected.proofOfDelivery.recipientName || "-"}
                          </dd>
                        </div>
                        <div>
                          <dt>Confirmed at</dt>
                          <dd>
                            {selected.proofOfDelivery.confirmedAt
                              ? formatWhen(
                                  selected.proofOfDelivery.confirmedAt,
                                )
                              : "-"}
                          </dd>
                        </div>
                        <div>
                          <dt>Confirmed by</dt>
                          <dd>
                            {selected.proofOfDelivery.confirmedByName || "-"}
                          </dd>
                        </div>
                        {selected.proofOfDelivery.evidenceHref ? (
                          <div>
                            <dt>Evidence</dt>
                            <dd>
                              <a href={selected.proofOfDelivery.evidenceHref}>
                                {selected.proofOfDelivery.evidenceLabel ||
                                  "View evidence"}
                              </a>
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : (
                      <>
                        <p className="hamd-sh-empty">
                          Proof of delivery not yet confirmed.
                          {selected.proofOfDelivery.notes
                            ? ` ${selected.proofOfDelivery.notes}`
                            : ""}
                        </p>
                        {canConfirmDelivery ? (
                          <form
                            className="hamd-sh-create"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void run(async () => {
                                if (podForm.evidenceDocumentIds.length === 0) {
                                  throw new Error(
                                    "Select at least one linked evidence document before confirming delivery.",
                                  );
                                }
                                await onConfirmDelivery?.(
                                  selected.id,
                                  {
                                    recipientName: podForm.recipientName.trim(),
                                    evidenceDocumentIds:
                                      podForm.evidenceDocumentIds,
                                    ...(podForm.notes.trim()
                                      ? { notes: podForm.notes.trim() }
                                      : {}),
                                  },
                                  { rowVersion: selected.rowVersion },
                                );
                              }, "Delivery confirmed");
                            }}
                          >
                            <label>
                              Recipient name
                              <input
                                required
                                value={podForm.recipientName}
                                onChange={(e) =>
                                  setPodForm((prev) => ({
                                    ...prev,
                                    recipientName: e.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label>
                              Notes
                              <input
                                value={podForm.notes}
                                onChange={(e) =>
                                  setPodForm((prev) => ({
                                    ...prev,
                                    notes: e.target.value,
                                  }))
                                }
                              />
                            </label>
                            <fieldset className="hamd-sh-evidence">
                              <legend>Evidence documents</legend>
                              {selected.documents.length === 0 ? (
                                <p className="hamd-sh-empty">
                                  Link documents on the Documents tab before
                                  confirming delivery.
                                </p>
                              ) : (
                                <ul className="hamd-sh-check-list">
                                  {selected.documents.map((doc) => {
                                    const evidenceId = doc.documentId ?? doc.id;
                                    const checked =
                                      podForm.evidenceDocumentIds.includes(
                                        evidenceId,
                                      );
                                    return (
                                      <li key={doc.id}>
                                        <label>
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                              setPodForm((prev) => ({
                                                ...prev,
                                                evidenceDocumentIds: checked
                                                  ? prev.evidenceDocumentIds.filter(
                                                      (id) => id !== evidenceId,
                                                    )
                                                  : [
                                                      ...prev.evidenceDocumentIds,
                                                      evidenceId,
                                                    ],
                                              }))
                                            }
                                          />{" "}
                                          {doc.name}
                                        </label>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </fieldset>
                            <button
                              type="submit"
                              className="hamd-sh-btn hamd-sh-btn--primary"
                              disabled={selected.documents.length === 0}
                            >
                              Confirm proof of delivery
                            </button>
                          </form>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : null}

                {tab === "history" && selected ? (
                  <ol className="hamd-sh-timeline" aria-label="Shipment history">
                    {selected.history.length === 0 ? (
                      <li className="hamd-sh-empty">No history events.</li>
                    ) : (
                      selected.history.map((event) => (
                        <li key={event.id}>
                          <p className="hamd-sh-timeline__label">
                            {event.command.replaceAll("_", " ")}
                            {event.fromStatus
                              ? ` (${event.fromStatus} → ${event.toStatus})`
                              : ` → ${event.toStatus}`}
                          </p>
                          <p className="hamd-sh-timeline__detail">
                            {event.actorName || "System"}
                            {event.reason ? ` · ${event.reason}` : ""}
                          </p>
                          <time dateTime={event.createdAt}>
                            {formatWhen(event.createdAt)}
                          </time>
                        </li>
                      ))
                    )}
                  </ol>
                ) : null}

                {tab === "map" && selected ? (
                  <div
                    className="hamd-sh-map"
                    role="img"
                    aria-label={`Map: ${selected.map.label}`}
                  >
                    {renderMap ? (
                      <div className="hamd-sh-map__slot">
                        {renderMap({ shipment: selected })}
                      </div>
                    ) : adaptedMap ? (
                      <div className="hamd-sh-map__slot">
                        {adaptedMap as ReactNode}
                      </div>
                    ) : (
                      <div className="hamd-sh-map__canvas">
                        <span className="hamd-sh-map__pin" aria-hidden="true" />
                        <p className="hamd-sh-map__label">{selected.map.label}</p>
                        <p className="hamd-sh-map__meta">
                          {selected.map.region || "Route preview"}
                          {selected.map.latitude != null &&
                          selected.map.longitude != null
                            ? ` · ${selected.map.latitude.toFixed(4)}, ${selected.map.longitude.toFixed(4)}`
                            : ""}
                        </p>
                        <p className="hamd-sh-map__hint">
                          Map provider not configured - inject `mapAdapter` or
                          `renderMap` with a real mapping SDK. No fake map is
                          rendered.
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}

                {tab === "create" && canCreate ? (
                  <form
                    className="hamd-sh-create"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void run(async () => {
                        await onCreate?.({
                          purchaseOrderId: createForm.purchaseOrderId.trim(),
                          ...(createForm.carrierName.trim()
                            ? { carrierName: createForm.carrierName.trim() }
                            : {}),
                          ...(createForm.trackingNumber.trim()
                            ? {
                                trackingNumber:
                                  createForm.trackingNumber.trim(),
                              }
                            : {}),
                          ...(createForm.transportMode.trim()
                            ? {
                                transportMode: createForm.transportMode.trim(),
                              }
                            : {}),
                          ...(createForm.estimatedArrivalAt.trim()
                            ? {
                                estimatedArrivalAt:
                                  createForm.estimatedArrivalAt.trim(),
                              }
                            : {}),
                          ...(createForm.originLabel.trim()
                            ? { originLabel: createForm.originLabel.trim() }
                            : {}),
                          ...(createForm.destinationLabel.trim()
                            ? {
                                destinationLabel:
                                  createForm.destinationLabel.trim(),
                              }
                            : {}),
                        });
                      }, "Shipment created");
                    }}
                  >
                    <h2>Create shipment</h2>
                    <label>
                      Purchase order ID
                      <input
                        required
                        value={createForm.purchaseOrderId}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            purchaseOrderId: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Carrier
                      <input
                        value={createForm.carrierName}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            carrierName: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Tracking number
                      <input
                        value={createForm.trackingNumber}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            trackingNumber: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Transport mode
                      <input
                        value={createForm.transportMode}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            transportMode: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      ETA (ISO datetime)
                      <input
                        value={createForm.estimatedArrivalAt}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            estimatedArrivalAt: e.target.value,
                          }))
                        }
                        placeholder="2026-08-20T12:00:00.000Z"
                      />
                    </label>
                    <label>
                      Origin
                      <input
                        value={createForm.originLabel}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            originLabel: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Destination
                      <input
                        value={createForm.destinationLabel}
                        onChange={(e) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            destinationLabel: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <button
                      type="submit"
                      className="hamd-sh-btn hamd-sh-btn--primary"
                    >
                      Create planned shipment
                    </button>
                  </form>
                ) : null}
              </div>
            </>
          ) : (
            <p className="hamd-sh-empty" role="status">
              Select a shipment or create one.
            </p>
          )}
        </section>
      </div>

      {error ? (
        <p className="hamd-sh-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
