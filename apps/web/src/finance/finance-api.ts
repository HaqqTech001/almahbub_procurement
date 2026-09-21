import { safeErrorMessage } from "@hamd/ui/auth";
import { getAccessToken } from "../auth/session/token-store.js";
import { sessionFetch } from "../auth/session/session-http.js";
import { browserApiBase } from "../lib/api-origin.js";

type Envelope<T> = { data: T; error?: { code?: string; message?: string } };

export type InvoiceRow = {
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

export type PaymentRow = {
  id: string;
  status: string;
  amount?: string;
  currencyCode?: string;
  method?: string;
  providerReference?: string;
  createdAt?: string;
};

function apiBase(): string {
  return browserApiBase();
}

function url(path: string): string {
  const base = apiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return `/api/v1${normalized}`;
  return `${base}/api/v1${normalized}`;
}

export class FinanceApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number, code: string) {
    super(safeErrorMessage(message, status));
    this.name = "FinanceApiError";
    this.status = status;
    this.code = code;
  }
}

async function financeFetch<T>(
  path: string,
  options: {
    accessToken: string;
    query?: Record<string, string | number | undefined>;
  },
): Promise<T> {
  let endpoint = url(path);
  if (options.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) endpoint += `?${qs}`;
  }

  const response = await sessionFetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${options.accessToken}`,
    },
    credentials: "include",
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const envelope = body as {
      error?: { code?: string; message?: string };
      message?: string;
    } | null;
    throw new FinanceApiError(
      envelope?.error?.message ?? envelope?.message ?? "Finance request failed.",
      response.status,
      envelope?.error?.code ?? "FINANCE_ERROR",
    );
  }

  const envelope = body as Envelope<T> | null;
  if (envelope && "data" in envelope) return envelope.data;
  return body as T;
}

export async function listInvoices(
  accessToken: string,
  query?: { pageSize?: number; status?: string },
): Promise<InvoiceRow[]> {
  const rows = await financeFetch<InvoiceRow[]>("/invoices", {
    accessToken,
    query: { pageSize: query?.pageSize ?? 100, status: query?.status },
  });
  return rows.map((row) => ({
    ...row,
    dueAt:
      row.dueAt == null
        ? null
        : typeof row.dueAt === "string"
          ? row.dueAt
          : new Date(row.dueAt).toISOString(),
    createdAt:
      row.createdAt == null
        ? undefined
        : typeof row.createdAt === "string"
          ? row.createdAt
          : new Date(row.createdAt).toISOString(),
  }));
}

export async function listPayments(
  accessToken: string,
  query?: { pageSize?: number; status?: string },
): Promise<PaymentRow[]> {
  const rows = await financeFetch<PaymentRow[]>("/payments", {
    accessToken,
    query: { pageSize: query?.pageSize ?? 100, status: query?.status },
  });
  return rows.map((row) => ({
    ...row,
    amount: row.amount != null ? String(row.amount) : undefined,
    createdAt:
      row.createdAt == null
        ? undefined
        : typeof row.createdAt === "string"
          ? row.createdAt
          : new Date(row.createdAt).toISOString(),
  }));
}

export async function requireFinanceToken(
  ensureSession: () => Promise<string | null>,
): Promise<string> {
  const token = getAccessToken() ?? (await ensureSession());
  if (!token) {
    throw new FinanceApiError(
      "Sign in again to view finance records.",
      401,
      "UNAUTHENTICATED",
    );
  }
  return token;
}
