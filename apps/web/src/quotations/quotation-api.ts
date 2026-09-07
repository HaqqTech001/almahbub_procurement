import type {
  QuotationCommand,
  QuotationCreateInput,
  QuotationHistoryEvent,
  QuotationRecord,
} from "@hamd/ui/quotations";
import {
  readResponseBody,
  toCancelledRequestError,
  unwrapEnvelopeData,
} from "@hamd/ui/auth";

import { getAccessToken } from "../auth/session/token-store.js";
import { sessionFetch } from "../auth/session/session-http.js";
import { browserApiBase } from "../lib/api-origin.js";

type Envelope<T> = { data: T; error?: { code?: string; message?: string } };

export type ApiQuotation = {
  id: string;
  familyId: string;
  supersedesId?: string | null;
  versionNumber: number;
  publicCode: string;
  procurementRequestId: string;
  procurementRequestCode?: string;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierCountryCode?: string | null;
  supplierStatus?: string | null;
  status: string;
  currencyCode: string;
  price?: {
    subtotalAmount: string;
    discountAmount: string;
    taxAmount: string;
    shippingAmount: string;
    dutyAmount: string;
    otherAmount: string;
    totalAmount: string;
  };
  expiresAt?: string | null;
  deliveryLeadTimeDays?: number | null;
  minimumOrderQuantity?: string | null;
  paymentTerms?: string | null;
  commercialTerms?: string | null;
  rowVersion: number;
  documentIds: string[];
  attachments?: Array<{
    id: string;
    documentId: string;
    name: string;
    href: string;
    kind: string;
    uploadedAt: string;
  }>;
  versions?: Array<{
    id: string;
    versionNumber: number;
    publicCode: string;
    status: string;
    totalAmount: string;
    createdAt: string;
    current?: boolean;
  }>;
  items?: Array<{
    id: string;
    procurementRequestItemId?: string | null;
    productVariantId?: string | null;
    description: string;
    quantity: string;
    unitAmount: string;
    lineAmount: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

function apiBase(): string {
  return browserApiBase();
}

function quotationsUrl(path = ""): string {
  const base = apiBase();
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  if (!base) return `/api/v1/quotations${normalized}`;
  return `${base}/api/v1/quotations${normalized}`;
}

export class QuotationApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "QuotationApiError";
    this.status = status;
    this.code = code;
  }
}

async function quotationFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken: string;
    query?: Record<string, string | number | undefined>;
  },
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${options.accessToken}`,
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let url = quotationsUrl(path);
  if (options.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  let response: Response;
  try {
    response = await sessionFetch(url, {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "include",
    });
  } catch (error) {
    const cancelled = toCancelledRequestError(error);
    if (cancelled) throw cancelled;
    throw error;
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    const envelope = body as {
      error?: { code?: string; message?: string };
      message?: string;
    } | null;
    throw new QuotationApiError(
      envelope?.error?.message ??
        envelope?.message ??
        "We couldn't complete this quotation action.",
      response.status,
      envelope?.error?.code ?? "QUOTATION_ERROR",
    );
  }

  if (response.status === 204 || response.status === 205 || body == null) {
    return undefined as T;
  }
  return unwrapEnvelopeData<T>(body);
}

export function unwrapQuotationList(payload: unknown): ApiQuotation[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as ApiQuotation[];
    if (Array.isArray(record.items)) return record.items as ApiQuotation[];
  }
  return [];
}

function asMoney(value: unknown): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function asIso(value: string | Date | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  if (typeof value === "string") return value;
  return new Date(value).toISOString();
}

export function mapApiQuotationToRecord(
  row: ApiQuotation,
  history: QuotationHistoryEvent[] = [],
): QuotationRecord {
  const price = row.price ?? {
    subtotalAmount: "0",
    discountAmount: "0",
    taxAmount: "0",
    shippingAmount: "0",
    dutyAmount: "0",
    otherAmount: "0",
    totalAmount: "0",
  };
  return {
    id: row.id,
    publicCode: row.publicCode,
    status: row.status,
    versionNumber: row.versionNumber,
    familyId: row.familyId,
    procurementRequestId: row.procurementRequestId,
    procurementRequestCode: row.procurementRequestCode,
    supplierId: row.supplierId,
    supplierName: row.supplierName,
    currencyCode: row.currencyCode,
    subtotalAmount: asMoney(price.subtotalAmount),
    discountAmount: asMoney(price.discountAmount),
    taxAmount: asMoney(price.taxAmount),
    shippingAmount: asMoney(price.shippingAmount),
    dutyAmount: asMoney(price.dutyAmount),
    otherAmount: asMoney(price.otherAmount),
    totalAmount: asMoney(price.totalAmount),
    expiresAt: row.expiresAt
      ? asIso(row.expiresAt)
      : null,
    deliveryLeadTimeDays: row.deliveryLeadTimeDays,
    minimumOrderQuantity:
      row.minimumOrderQuantity != null
        ? asMoney(row.minimumOrderQuantity)
        : null,
    paymentTerms: row.paymentTerms,
    commercialTerms: row.commercialTerms,
    rowVersion: row.rowVersion,
    createdAt: asIso(row.createdAt),
    updatedAt: asIso(row.updatedAt),
    items: (row.items ?? []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: asMoney(item.quantity),
      unitAmount: asMoney(item.unitAmount),
      lineAmount: asMoney(item.lineAmount),
      procurementRequestItemId: item.procurementRequestItemId,
      productVariantId: item.productVariantId,
    })),
    attachments: (row.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      href: attachment.href,
      kind: attachment.kind,
      uploadedAt: asIso(attachment.uploadedAt),
    })),
    versions: (row.versions ?? []).map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      publicCode: version.publicCode,
      status: version.status,
      totalAmount: asMoney(version.totalAmount),
      createdAt: asIso(version.createdAt),
      current: version.current,
    })),
    history,
    negotiation: [],
  };
}

export async function listQuotations(
  accessToken: string,
  query?: {
    pageSize?: number;
    status?: string;
    procurementRequestId?: string;
    familyId?: string;
    supplierId?: string;
  },
): Promise<QuotationRecord[]> {
  const rows = unwrapQuotationList(
    await quotationFetch<unknown>("", {
      method: "GET",
      accessToken,
      query: {
        pageSize: query?.pageSize ?? 100,
        status: query?.status,
        procurementRequestId: query?.procurementRequestId,
        familyId: query?.familyId,
        supplierId: query?.supplierId,
      },
    }),
  );
  return rows.flatMap((row) => {
    try {
      return [mapApiQuotationToRecord(row)];
    } catch {
      return [];
    }
  });
}

export async function getQuotation(
  accessToken: string,
  quotationId: string,
): Promise<QuotationRecord> {
  const [row, history] = await Promise.all([
    quotationFetch<ApiQuotation>(`/${quotationId}`, {
      method: "GET",
      accessToken,
    }),
    quotationFetch<QuotationHistoryEvent[]>(`/${quotationId}/history`, {
      method: "GET",
      accessToken,
    }),
  ]);
  return mapApiQuotationToRecord(
    row,
    history.map((event) => ({
      ...event,
      createdAt:
        typeof event.createdAt === "string"
          ? event.createdAt
          : new Date(event.createdAt).toISOString(),
    })),
  );
}

export async function createQuotation(
  accessToken: string,
  input: QuotationCreateInput,
): Promise<QuotationRecord> {
  const quantitySubtotal = input.items.reduce(
    (sum, item) => sum + item.quantity * item.unitAmount,
    0,
  );
  const row = await quotationFetch<ApiQuotation>("", {
    method: "POST",
    accessToken,
    body: {
      procurementRequestId: input.procurementRequestId,
      ...(input.supplierId ? { supplierId: input.supplierId } : {}),
      currencyCode: input.currencyCode,
      expiresAt: input.expiresAt ?? undefined,
      deliveryLeadTimeDays: input.deliveryLeadTimeDays ?? undefined,
      discountAmount: input.discountAmount,
      taxAmount: input.taxAmount,
      shippingAmount: input.shippingAmount ?? 0,
      dutyAmount: input.dutyAmount ?? 0,
      otherAmount: input.otherAmount ?? 0,
      subtotalAmount: quantitySubtotal,
      paymentTerms: input.paymentTerms,
      commercialTerms: input.commercialTerms,
      items: input.items,
      documentIds: [],
    },
  });
  return mapApiQuotationToRecord(row);
}

export async function transitionQuotation(
  accessToken: string,
  quotationId: string,
  command: QuotationCommand,
  meta: { rowVersion: number; reason?: string },
): Promise<QuotationRecord> {
  const row = await quotationFetch<ApiQuotation>(
    `/${quotationId}/transitions`,
    {
      method: "POST",
      accessToken,
      body: {
        command,
        rowVersion: meta.rowVersion,
        ...(meta.reason ? { reason: meta.reason } : {}),
      },
    },
  );
  return mapApiQuotationToRecord(row);
}

export async function reviseQuotation(
  accessToken: string,
  quotationId: string,
  meta: { rowVersion: number; reason: string },
): Promise<QuotationRecord> {
  const row = await quotationFetch<ApiQuotation>(`/${quotationId}/revise`, {
    method: "POST",
    accessToken,
    body: meta,
  });
  return mapApiQuotationToRecord(row);
}

export async function requireQuotationToken(
  ensureSession: () => Promise<string | null>,
): Promise<string> {
  const token = getAccessToken() ?? (await ensureSession());
  if (!token) {
    throw new QuotationApiError(
      "Sign in again to manage quotations.",
      401,
      "UNAUTHENTICATED",
    );
  }
  return token;
}
