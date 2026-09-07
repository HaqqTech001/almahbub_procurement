import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth/session/AuthProvider.js";
import { HostAlert, HostLoading, HostPage } from "../components/HostChrome.js";
import {
  FinanceApiError,
  listInvoices,
  requireFinanceToken,
  type InvoiceRow,
} from "./finance-api.js";

function formatWhen(value?: string | null): string {
  if (!value) return "Not supplied";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function InvoicesPage() {
  const auth = useAuth();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireFinanceToken(auth.ensureSession);
      setRows(await listInvoices(token, { pageSize: 100 }));
    } catch (err) {
      setError(
        err instanceof FinanceApiError
          ? err.status === 403
            ? "You do not have permission to view invoices."
            : err.message
          : "Unable to load invoices.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <HostPage className="hamd-web-finance hamd-list-queue">
      <header className="hamd-web-finance__header">
        <div>
          <p className="hamd-web-finance__eyebrow">Finance</p>
          <h1>My invoices</h1>
          <p>Invoices issued to your organisation for approved procurement.</p>
        </div>
        <button type="button" className="hamd-btn hamd-btn--ghost" onClick={() => void refresh()}>
          Refresh
        </button>
      </header>
      {error ? <HostAlert>{error}</HostAlert> : null}
      {loading ? <HostLoading label="Loading invoices…" /> : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="hamd-web-finance__empty" role="status">
          No invoices yet.
        </p>
      ) : null}
      {!loading && rows.length > 0 ? (
        <div className="hamd-web-finance__table-wrap">
          <table className="hamd-web-finance__table">
            <thead>
              <tr>
                <th scope="col">Number</th>
                <th scope="col">Status</th>
                <th scope="col">Total</th>
                <th scope="col">Outstanding</th>
                <th scope="col">Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.invoiceNumber}</td>
                  <td>{row.status.replaceAll("_", " ")}</td>
                  <td>
                    {row.totalAmount ? `${row.currencyCode ?? ""} ${row.totalAmount}` : "Not supplied"}
                  </td>
                  <td>
                    {row.outstandingAmount ? `${row.currencyCode ?? ""} ${row.outstandingAmount}` : "Not supplied"}
                  </td>
                  <td>{formatWhen(row.dueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </HostPage>
  );
}
