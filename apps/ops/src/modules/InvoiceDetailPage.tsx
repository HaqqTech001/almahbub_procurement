import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "@hamd/ui/primitives";

import {
  getInvoice,
  InvoiceApiError,
  requireInvoiceToken,
  type InvoiceRow,
} from "../api/invoice-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage } from "../components/OpsChrome.js";

function formatDate(iso: string | undefined | null): string {
  if (!iso) return "Not recorded";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function humanize(status: string): string {
  return status.replaceAll("_", " ");
}

export function InvoiceDetailPage() {
  const auth = useAuth();
  const { id = "" } = useParams();
  const [row, setRow] = useState<InvoiceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await requireInvoiceToken(auth.ensureSession);
      setRow(await getInvoice(token, id));
    } catch (err) {
      setError(err instanceof InvoiceApiError ? err.message : "Unable to load invoice.");
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = (row as InvoiceRow & { items?: Array<{ id: string; description: string; lineAmount: string }> })
    ?.items;

  return (
    <OpsPage>
      <p>
        <Link to="/invoices">Invoices</Link>
      </p>
      {error ? <OpsAlert tone="danger">{error}</OpsAlert> : null}
      {loading ? <OpsLoading label="Loading invoice…" /> : null}
      {!loading && row ? (
        <article className="hamd-entity-page">
          <header className="hamd-entity-form__header">
            <div>
              <h1>{row.invoiceNumber}</h1>
              <StatusBadge status={row.status} label={humanize(row.status)} />
            </div>
          </header>
          <section className="hamd-entity-section">
            <h2>Overview</h2>
            <dl className="hamd-entity-meta">
              <div>
                <dt>Purchase order</dt>
                <dd>{row.purchaseOrderCode ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>
                  {row.totalAmount ?? "Not recorded"} {row.currencyCode ?? ""}
                </dd>
              </div>
              <div>
                <dt>Outstanding</dt>
                <dd>{row.outstandingAmount ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Issued</dt>
                <dd>{formatDate(row.createdAt)}</dd>
              </div>
              <div>
                <dt>Due</dt>
                <dd>{formatDate(row.dueAt)}</dd>
              </div>
            </dl>
          </section>
          <section className="hamd-entity-section">
            <h2>Line items</h2>
            {items && items.length > 0 ? (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    {item.description} · {item.lineAmount}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No line items on this invoice.</p>
            )}
          </section>
        </article>
      ) : null}
    </OpsPage>
  );
}
