import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  QuotationWorkspace,
  type QuotationCommand,
  type QuotationRecord,
} from "@hamd/ui/quotations";

import { useAuth } from "../auth/session/AuthProvider.js";
import { useToast } from "../app/providers/ToastProvider.js";
import { HostPage } from "../components/HostChrome.js";
import {
  listQuotations,
  QuotationApiError,
  requireQuotationToken,
  transitionQuotation,
} from "./quotation-api.js";

/**
 * Hosted quotation directory + detail - production API only.
 */
export function QuotationsPage({
  initialSelectedId,
}: {
  initialSelectedId?: string | undefined;
} = {}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const { push: pushToast } = useToast();
  const [rows, setRows] = useState<QuotationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await requireQuotationToken(auth.ensureSession);
      const next = await listQuotations(token, { pageSize: 100 });
      setRows(next);
    } catch (err) {
      pushToast({
        title: "Unable to load quotations",
        description:
          err instanceof QuotationApiError
            ? err.message
            : "Please try again in a moment.",
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, pushToast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const withToken = async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
    const token = await requireQuotationToken(auth.ensureSession);
    return fn(token);
  };

  return (
    <HostPage className="hamd-web-quotations hamd-list-queue">
      <QuotationWorkspace
        quotations={rows}
        loading={loading}
        title="My quotations"
        initialSelectedId={initialSelectedId}
        compareHref="/app/quotations/compare"
        historyHref="/app/quotations/history"
        canCreate={false}
        canTransition={
          auth.permissions.includes("quotation:read") ||
          auth.permissions.includes("request:read")
        }
        canRevise={false}
        allowedCommands={["accept", "decline"]}
        onSelect={(quotation) => {
          navigate(`/app/quotations/${quotation.id}`, { replace: true });
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
            /* quotation action succeeded */
          }
        }}
        onBulkDecline={async (ids) => {
          await withToken(async (token) => {
            for (const id of ids) {
              const row = rows.find((item) => item.id === id);
              if (!row || row.status !== "issued") continue;
              await transitionQuotation(token, id, "decline", {
                rowVersion: row.rowVersion,
                reason: "Bulk rejection from quotation directory",
              });
            }
          });
          try {
            await refresh();
          } catch {
            /* declines succeeded */
          }
        }}
      />
    </HostPage>
  );
}
