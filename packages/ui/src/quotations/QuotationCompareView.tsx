import { useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import {
  runQuotationAiComparison,
  type QuotationAiComparisonAdapter,
  type QuotationAiComparisonState,
} from "./ai-comparison.js";
import {
  formatMoney,
  quotationStatusLabel,
  type QuotationRecord,
} from "./types.js";

export type QuotationCompareViewProps = {
  quotations: QuotationRecord[];
  selectedIds?: readonly string[] | undefined;
  title?: string | undefined;
  className?: string | undefined;
  aiAdapter?: QuotationAiComparisonAdapter | null | undefined;
  onSelectionChange?: ((ids: string[]) => void) | undefined;
};

/**
 * Side-by-side commercial comparison for issued quotations.
 * AI panel is future-ready and never invents insights.
 */
export function QuotationCompareView({
  quotations,
  selectedIds,
  title = "Compare quotations",
  className,
  aiAdapter,
  onSelectionChange,
}: QuotationCompareViewProps) {
  const [picked, setPicked] = useState<string[]>(
    () =>
      selectedIds?.slice(0, 4).map(String) ??
      quotations.slice(0, 2).map((row) => row.id),
  );
  const [aiState, setAiState] = useState<QuotationAiComparisonState>({
    status: "idle",
  });

  const columns = useMemo(
    () => quotations.filter((row) => picked.includes(row.id)).slice(0, 4),
    [quotations, picked],
  );

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = prev.includes(id)
        ? prev.filter((value) => value !== id)
        : prev.length >= 4
          ? prev
          : [...prev, id];
      onSelectionChange?.(next);
      return next;
    });
  };

  const rows: Array<{
    label: string;
    value: (q: QuotationRecord) => string;
  }> = [
    { label: "Code", value: (q) => `${q.publicCode} · v${q.versionNumber}` },
    { label: "Status", value: (q) => quotationStatusLabel(String(q.status)) },
    { label: "Supplier", value: (q) => q.supplierName ?? "-" },
    { label: "Request", value: (q) => q.procurementRequestCode ?? q.procurementRequestId },
    {
      label: "Total",
      value: (q) => formatMoney(q.totalAmount, q.currencyCode),
    },
    {
      label: "Subtotal",
      value: (q) => formatMoney(q.subtotalAmount, q.currencyCode),
    },
    {
      label: "Discount",
      value: (q) => formatMoney(q.discountAmount, q.currencyCode),
    },
    {
      label: "Taxes",
      value: (q) => formatMoney(q.taxAmount, q.currencyCode),
    },
    {
      label: "Shipping",
      value: (q) => formatMoney(q.shippingAmount, q.currencyCode),
    },
    {
      label: "Duty / other",
      value: (q) =>
        formatMoney(q.dutyAmount + q.otherAmount, q.currencyCode),
    },
    {
      label: "Lead time",
      value: (q) =>
        q.deliveryLeadTimeDays != null ? `${q.deliveryLeadTimeDays} days` : "-",
    },
    {
      label: "MOQ",
      value: (q) =>
        q.minimumOrderQuantity != null ? String(q.minimumOrderQuantity) : "-",
    },
    { label: "Payment terms", value: (q) => q.paymentTerms ?? "-" },
    {
      label: "Delivery / commercial",
      value: (q) => q.commercialTerms ?? "-",
    },
    {
      label: "Warranty",
      value: (q) =>
        q.commercialTerms?.toLowerCase().includes("warrant")
          ? q.commercialTerms
          : "See commercial terms",
    },
    {
      label: "Expires",
      value: (q) =>
        q.expiresAt ? new Date(q.expiresAt).toLocaleString() : "-",
    },
    {
      label: "Approval",
      value: (q) => quotationStatusLabel(String(q.status)),
    },
    {
      label: "Line items",
      value: (q) => String(q.items.length),
    },
  ];

  return (
    <div className={cx("hamd-qt-compare", className)}>
      <header className="hamd-qt-compare__header">
        <div>
          <h1>{title}</h1>
          <p>Select up to four quotations for a commercial side-by-side review.</p>
        </div>
        <button
          type="button"
          className="hamd-qt-btn hamd-qt-btn--secondary"
          disabled={columns.length < 2 || aiState.status === "loading"}
          onClick={() => {
            void (async () => {
              setAiState({ status: "loading" });
              const next = await runQuotationAiComparison(aiAdapter, {
                quotationIds: columns.map((row) => row.id),
                focus: "overall",
              });
              setAiState(next);
            })();
          }}
        >
          Run AI comparison
        </button>
      </header>

      <fieldset className="hamd-qt-compare__picker">
        <legend>Quotations</legend>
        <ul>
          {quotations.map((row) => (
            <li key={row.id}>
              <label>
                <input
                  type="checkbox"
                  checked={picked.includes(row.id)}
                  onChange={() => toggle(row.id)}
                />
                <span>
                  {row.publicCode} · {row.supplierName ?? "Supplier TBD"} ·{" "}
                  {formatMoney(row.totalAmount, row.currencyCode)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      {columns.length === 0 ? (
        <p role="status">Select quotations to compare.</p>
      ) : (
        <div className="hamd-qt-compare__table-wrap" role="region" aria-label="Comparison table">
          <table className="hamd-qt-compare__table">
            <thead>
              <tr>
                <th scope="col">Attribute</th>
                {columns.map((column) => (
                  <th key={column.id} scope="col">
                    {column.publicCode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {columns.map((column) => (
                    <td key={`${row.label}-${column.id}`}>{row.value(column)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="hamd-qt-compare__ai" aria-live="polite">
        <h2>AI comparison</h2>
        {aiState.status === "idle" ? (
          <p>Future-ready. Connect an AI adapter to generate insights - no mock results.</p>
        ) : null}
        {aiState.status === "loading" ? <p>Running comparison…</p> : null}
        {aiState.status === "unavailable" ? (
          <p role="status">{aiState.reason}</p>
        ) : null}
        {aiState.status === "error" ? (
          <p role="alert">{aiState.message}</p>
        ) : null}
        {aiState.status === "ready" ? (
          <div>
            <p>{aiState.result.narrative}</p>
            <ul>
              {aiState.result.insights.map((insight) => (
                <li key={insight.quotationId}>
                  <strong>{insight.quotationId}</strong>: {insight.summary}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
