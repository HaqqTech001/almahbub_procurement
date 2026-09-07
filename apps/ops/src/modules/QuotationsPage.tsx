import { useCallback, useEffect, useState } from "react";
import {
  QuotationWorkspace,
  type QuotationCommand,
  type QuotationCreateInput,
  type QuotationRecord,
} from "@hamd/ui/quotations";

import {
  createQuotation,
  listQuotations,
  requireQuotationToken,
  reviseQuotation,
  transitionQuotation,
} from "../api/quotation-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsPage } from "../components/OpsChrome.js";

export function QuotationsPage() {
  const auth = useAuth();
  const [rows, setRows] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await requireQuotationToken(auth.ensureSession);
      setRows(await listQuotations(token, { pageSize: 100 }));
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const withToken = async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
    const token = await requireQuotationToken(auth.ensureSession);
    return fn(token);
  };

  return (
    <OpsPage className="hamd-ops-quotations hamd-list-queue">
      <QuotationWorkspace
        quotations={rows}
        loading={loading}
        title="Quotations"
        canCreate={auth.permissions.includes("quotation:create")}
        canTransition={
          auth.permissions.includes("quotation:review") ||
          auth.permissions.includes("quotation:issue")
        }
        canRevise={auth.permissions.includes("quotation:revise")}
        allowedCommands={[
          ...(auth.permissions.includes("quotation:review") ? (["review"] as const) : []),
          ...(auth.permissions.includes("quotation:issue") ? (["issue"] as const) : []),
        ]}
        onCreate={async (input: QuotationCreateInput) => {
          await withToken((token) => createQuotation(token, input));
          try {
            await refresh();
          } catch {
            /* create succeeded */
          }
        }}
        onTransition={async (
          quotationId,
          command: QuotationCommand,
          meta,
        ) => {
          await withToken((token) =>
            transitionQuotation(token, quotationId, command, meta),
          );
          try {
            await refresh();
          } catch {
            /* transition succeeded */
          }
        }}
        onRevise={async (quotationId, meta) => {
          await withToken((token) => reviseQuotation(token, quotationId, meta));
          try {
            await refresh();
          } catch {
            /* revise succeeded */
          }
        }}
      />
    </OpsPage>
  );
}
