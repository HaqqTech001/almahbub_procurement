import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ModuleTable,
  ModuleWorkspace,
  type ModuleTableColumn,
} from "@hamd/ui/module-layout";
import { StatusBadge } from "@hamd/ui/primitives";

import {
  InvoiceApiError,
  listInvoices,
  requireInvoiceToken,
  type InvoiceRow,
} from "../api/invoice-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";

function formatDate(iso: string | undefined | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function InvoicesPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await requireInvoiceToken(auth.ensureSession);
      setRows(await listInvoices(token, { pageSize: 100 }));
    } catch (err) {
      setError(
        err instanceof InvoiceApiError
          ? err.message
          : "Unable to load invoices.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const columns: readonly ModuleTableColumn<InvoiceRow>[] = [
    { key: "invoiceNumber", label: "Invoice Number" },
    { key: "purchaseOrderCode", label: "PO Reference" },
    {
      key: "status",
      label: "Status",
      render: (row: InvoiceRow) => <StatusBadge status={row.status} />,
    },
    { key: "currencyCode", label: "Currency" },
    {
      key: "totalAmount",
      label: "Total",
      render: (row: InvoiceRow) =>
        row.totalAmount != null ? String(row.totalAmount) : "-",
    },
    {
      key: "outstandingAmount",
      label: "Outstanding",
      render: (row: InvoiceRow) =>
        row.outstandingAmount != null ? String(row.outstandingAmount) : "-",
    },
    {
      key: "dueAt",
      label: "Due Date",
      render: (row: InvoiceRow) => formatDate(row.dueAt),
    },
    {
      key: "createdAt",
      label: "Issue Date",
      render: (row: InvoiceRow) => formatDate(row.createdAt),
    },
  ];

  return (
    <ModuleWorkspace
      header={{
        title: "Invoices",
        description:
          "Manage procurement invoices, track amounts, monitor due dates, and reconcile outstanding balances.",
      }}
      loading={loading}
      error={error}
      onRetry={() => void refresh()}
      isEmpty={rows.length === 0}
      empty={{
        title: "No invoices yet",
        description:
          "Invoices appear when a purchase order is billed. This list stays empty until that happens.",
      }}
      loadingLabel="Loading invoices…"
    >
      <ModuleTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        onRowClick={(row) => navigate(`/invoices/${row.id}`)}
      />
    </ModuleWorkspace>
  );
}
