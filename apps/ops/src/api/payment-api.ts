import { getAccessToken } from "../auth/session/token-store.js";
import { OpsApiError, opsFetch, requireOpsToken } from "../lib/ops-fetch.js";

export type PaymentRow = Record<string, unknown> & {
  id: string;
  status: string;
  amount?: string;
  currencyCode?: string;
  method?: string;
  providerReference?: string;
  createdAt?: string;
};

export async function getPayment(
  accessToken: string,
  paymentId: string,
): Promise<PaymentRow> {
  const row = await opsFetch<PaymentRow>(`/payments/${paymentId}`, {
    method: "GET",
    accessToken,
  });
  return {
    ...row,
    amount: row.amount != null ? String(row.amount) : undefined,
  };
}

export async function listPayments(
  accessToken: string,
  query?: { pageSize?: number; status?: string },
): Promise<PaymentRow[]> {
  const rows = await opsFetch<PaymentRow[]>("/payments", {
    method: "GET",
    accessToken,
    query: {
      pageSize: query?.pageSize ?? 100,
      status: query?.status,
    },
  });
  return rows.map((row) => ({
    ...row,
    amount: row.amount != null ? String(row.amount) : undefined,
    createdAt:
      row.createdAt == null
        ? undefined
        : typeof row.createdAt === "string"
          ? row.createdAt
          : new Date(row.createdAt as string).toISOString(),
  }));
}

export async function requirePaymentToken(
  ensureSession: () => Promise<string | null>,
): Promise<string> {
  return requireOpsToken(ensureSession, getAccessToken);
}

export { OpsApiError as PaymentApiError };
