import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth/session/AuthProvider.js";
import { HostAlert, HostLoading, HostPage } from "../components/HostChrome.js";
import {
  FinanceApiError,
  listPayments,
  requireFinanceToken,
  type PaymentRow,
} from "./finance-api.js";

function formatWhen(value?: string): string {
  if (!value) return "Not supplied";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function PaymentsPage() {
  const auth = useAuth();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireFinanceToken(auth.ensureSession);
      setRows(await listPayments(token, { pageSize: 100 }));
    } catch (err) {
      setError(
        err instanceof FinanceApiError
          ? err.status === 403
            ? "You do not have permission to view payments."
            : err.message
          : "Unable to load payments.",
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
          <h1>My payments</h1>
          <p>Payments recorded against your organisation’s invoices.</p>
        </div>
        <button type="button" className="hamd-btn hamd-btn--ghost" onClick={() => void refresh()}>
          Refresh
        </button>
      </header>
      {error ? <HostAlert>{error}</HostAlert> : null}
      {loading ? <HostLoading label="Loading payments…" /> : null}
      {!loading && !error && rows.length === 0 ? (
        <p className="hamd-web-finance__empty" role="status">
          No payments yet.
        </p>
      ) : null}
      {!loading && rows.length > 0 ? (
        <div className="hamd-web-finance__table-wrap">
          <table className="hamd-web-finance__table">
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Amount</th>
                <th scope="col">Method</th>
                <th scope="col">Reference</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.status.replaceAll("_", " ")}</td>
                  <td>
                    {row.amount ? `${row.currencyCode ?? ""} ${row.amount}` : "Not supplied"}
                  </td>
                  <td>{row.method?.replaceAll("_", " ") || "Not supplied"}</td>
                  <td>{row.providerReference || "Not supplied"}</td>
                  <td>{formatWhen(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </HostPage>
  );
}
