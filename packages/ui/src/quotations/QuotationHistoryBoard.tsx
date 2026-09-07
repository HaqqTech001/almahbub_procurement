import { useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import {
  formatMoney,
  quotationStatusLabel,
  type QuotationHistoryEvent,
  type QuotationRecord,
} from "./types.js";

export type QuotationHistoryBoardProps = {
  quotations: QuotationRecord[];
  title?: string | undefined;
  className?: string | undefined;
  onOpenQuotation?: ((quotationId: string) => void) | undefined;
};

/**
 * Cross-quotation audit / timeline history for the buyer workspace.
 */
export function QuotationHistoryBoard({
  quotations,
  title = "Quotation history",
  className,
  onOpenQuotation,
}: QuotationHistoryBoardProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const events = useMemo(() => {
    const flattened: Array<
      QuotationHistoryEvent & {
        quotationId: string;
        publicCode: string;
        supplierName?: string | null;
        totalAmount: number;
        currencyCode: string;
        quotationStatus: string;
      }
    > = [];
    for (const quotation of quotations) {
      for (const event of quotation.history) {
        flattened.push({
          ...event,
          quotationId: quotation.id,
          publicCode: quotation.publicCode,
          supplierName: quotation.supplierName ?? null,
          totalAmount: quotation.totalAmount,
          currencyCode: quotation.currencyCode,
          quotationStatus: String(quotation.status),
        });
      }
    }
    return flattened.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [quotations]);

  const filtered = events.filter((event) => {
    if (status !== "all" && event.quotationStatus !== status) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [
      event.publicCode,
      event.command,
      event.toStatus,
      event.actorName ?? "",
      event.supplierName ?? "",
      event.reason ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <div className={cx("hamd-qt-history-board", className)}>
      <header className="hamd-qt-history-board__header">
        <div>
          <h1>{title}</h1>
          <p>Audit timeline across quotation families, versions, and decisions.</p>
        </div>
      </header>

      <div className="hamd-qt-history-board__filters">
        <label>
          Search
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Code, actor, command…"
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
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
      </div>

      {filtered.length === 0 ? (
        <p role="status">No history events match these filters.</p>
      ) : (
        <ol className="hamd-qt-history-board__list">
          {filtered.map((event) => (
            <li key={`${event.quotationId}-${event.id}`}>
              <div>
                <strong>
                  {event.publicCode} · {event.command.replaceAll("_", " ")}
                </strong>
                <p>
                  {event.fromStatus
                    ? `${quotationStatusLabel(event.fromStatus)} → `
                    : ""}
                  {quotationStatusLabel(event.toStatus)}
                  {event.actorName ? ` · ${event.actorName}` : ""}
                  {" · "}
                  {new Date(event.createdAt).toLocaleString()}
                </p>
                {event.reason ? <p>{event.reason}</p> : null}
                <p>
                  {event.supplierName ?? "Supplier TBD"} ·{" "}
                  {formatMoney(event.totalAmount, event.currencyCode)} ·{" "}
                  {quotationStatusLabel(event.quotationStatus)}
                </p>
              </div>
              {onOpenQuotation ? (
                <button
                  type="button"
                  className="hamd-qt-btn hamd-qt-btn--secondary"
                  onClick={() => onOpenQuotation(event.quotationId)}
                >
                  Open
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
