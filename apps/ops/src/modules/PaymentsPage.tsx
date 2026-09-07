import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ModuleTable,
  ModuleWorkspace,
  type ModuleTableColumn,
} from "@hamd/ui/module-layout";
import { StatusBadge } from "@hamd/ui/primitives";

import {
  listPayments,
  PaymentApiError,
  requirePaymentToken,
  type PaymentRow,
} from "../api/payment-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";

export function PaymentsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await requirePaymentToken(auth.ensureSession);
      setRows(await listPayments(token, { pageSize: 100 }));
    } catch (err) {
      setError(
        err instanceof PaymentApiError
          ? err.message
          : "Unable to load payments.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const columns: readonly ModuleTableColumn<PaymentRow>[] = [
    { key: "providerReference", label: "Reference" },
    {
      key: "status",
      label: "Status",
      render: (row: PaymentRow) => <StatusBadge status={row.status} />,
    },
    { key: "amount", label: "Amount" },
    { key: "currencyCode", label: "Currency" },
    { key: "method", label: "Method" },
    { key: "createdAt", label: "Date" },
  ];

  return (
    <ModuleWorkspace
      header={{
        title: "Payments",
        description:
          "Track payment transactions, amounts, and settlement status across procurement activities.",
      }}
      loading={loading}
      error={error}
      onRetry={() => void refresh()}
      isEmpty={rows.length === 0}
      empty={{
        title: "No payments yet",
        description:
          "Payments appear after a quotation is accepted and a settlement is recorded. Nothing is invented here.",
      }}
      loadingLabel="Loading payments…"
    >
      <ModuleTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/payments/${row.id}`)}
      />
    </ModuleWorkspace>
  );
}
