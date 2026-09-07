import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "@hamd/ui/primitives";

import {
  getPayment,
  PaymentApiError,
  requirePaymentToken,
  type PaymentRow,
} from "../api/payment-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage } from "../components/OpsChrome.js";

function humanize(status: string): string {
  return status.replaceAll("_", " ");
}

export function PaymentDetailPage() {
  const auth = useAuth();
  const { id = "" } = useParams();
  const [row, setRow] = useState<PaymentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await requirePaymentToken(auth.ensureSession);
      setRow(await getPayment(token, id));
    } catch (err) {
      setError(err instanceof PaymentApiError ? err.message : "Unable to load payment.");
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <OpsPage>
      <p>
        <Link to="/payments">Payments</Link>
      </p>
      {error ? <OpsAlert tone="danger">{error}</OpsAlert> : null}
      {loading ? <OpsLoading label="Loading payment…" /> : null}
      {!loading && row ? (
        <article className="hamd-entity-page">
          <header className="hamd-entity-form__header">
            <div>
              <h1>{row.providerReference || row.id}</h1>
              <StatusBadge status={row.status} label={humanize(row.status)} />
            </div>
          </header>
          <section className="hamd-entity-section">
            <h2>Overview</h2>
            <dl className="hamd-entity-meta">
              <div>
                <dt>Amount</dt>
                <dd>
                  {row.amount ?? "Not recorded"} {row.currencyCode ?? ""}
                </dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{row.method ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Recorded</dt>
                <dd>
                  {row.createdAt
                    ? new Date(row.createdAt).toLocaleString()
                    : "Not recorded"}
                </dd>
              </div>
            </dl>
          </section>
        </article>
      ) : null}
    </OpsPage>
  );
}
