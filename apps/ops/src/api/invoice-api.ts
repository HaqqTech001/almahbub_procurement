import { getAccessToken } from "../auth/session/token-store.js";
import { OpsApiError, opsFetch, requireOpsToken } from "../lib/ops-fetch.js";

export type InvoiceRow = Record<string, unknown> & {
  id: string;
  invoiceNumber: string;
  status: string;
  purchaseOrderCode?: string;
  currencyCode?: string;
  totalAmount?: string;
  outstandingAmount?: string;
  dueAt?: string | null;
  createdAt?: string;
};

export async function getInvoice(
  accessToken: string,
  invoiceId: string,
): Promise<InvoiceRow> {
  return opsFetch<InvoiceRow>(`/invoices/${invoiceId}`, {
    method: "GET",
    accessToken,
  });
}

export async function listInvoices(
  accessToken: string,
  query?: { pageSize?: number; status?: string; search?: string },
): Promise<InvoiceRow[]> {
  const rows = await opsFetch<InvoiceRow[]>("/invoices", {
    method: "GET",
    accessToken,
    query: {
      pageSize: query?.pageSize ?? 100,
      status: query?.status,
      search: query?.search,
    },
  });
  return rows.map((row) => ({
    ...row,
    dueAt:
      row.dueAt == null
        ? null
        : typeof row.dueAt === "string"
          ? row.dueAt
          : new Date(row.dueAt as string).toISOString(),
    createdAt:
      row.createdAt == null
        ? undefined
        : typeof row.createdAt === "string"
          ? row.createdAt
          : new Date(row.createdAt as string).toISOString(),
  }));
}

export async function requireInvoiceToken(
  ensureSession: () => Promise<string | null>,
): Promise<string> {
  return requireOpsToken(ensureSession, getAccessToken);
}

export { OpsApiError as InvoiceApiError };
