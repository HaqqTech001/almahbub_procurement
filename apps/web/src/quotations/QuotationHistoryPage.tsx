import { ModuleSkeleton } from "@hamd/ui/module-layout";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  QuotationHistoryBoard,
  type QuotationRecord,
} from "@hamd/ui/quotations";

import {
  HostAlert,
  HostBackLink,

  HostPage,
} from "../components/HostChrome.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import {
  getQuotation,
  listQuotations,
  QuotationApiError,
  requireQuotationToken,
} from "./quotation-api.js";

export function QuotationHistoryPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<QuotationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await requireQuotationToken(auth.ensureSession);
      const listed = await listQuotations(token, { pageSize: 50 });
      const enriched = await Promise.all(
        listed.slice(0, 25).map(async (row) => {
          try {
            return await getQuotation(token, row.id);
          } catch {
            return row;
          }
        }),
      );
      setRows(enriched);
    } catch (err) {
      setError(
        err instanceof QuotationApiError
          ? err.message
          : "Unable to load quotation history.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <HostPage className="hamd-web-quotations">
      <HostBackLink to="/app/quotations">← Back to quotations</HostBackLink>
      {error ? <HostAlert>{error}</HostAlert> : null}
      {loading ? <ModuleSkeleton variant="list" /> : null}
      {!loading && !error ? (
        <QuotationHistoryBoard
          quotations={rows}
          onOpenQuotation={(id) => navigate(`/app/quotations/${id}`)}
        />
      ) : null}
    </HostPage>
  );
}
