import type {
  ProcurementCommand,
  ProcurementDraftPatch,
  ProcurementRequestRecord,
  RequestWizardSubmitPayload,
} from "@hamd/ui/procurement";

import {
  readResponseBody,
  toCancelledRequestError,
  unwrapEnvelopeData,
} from "@hamd/ui/auth";

import { getAccessToken } from "../auth/session/token-store.js";
import { browserApiBase } from "../lib/api-origin.js";
import { sessionFetch } from "../auth/session/session-http.js";

type Envelope<T> = { data: T; error?: { code?: string; message?: string } };

export type ApiRequestRelated = {
  quotations?: Array<{
    id: string;
    publicCode: string;
    status: string;
    totalAmount?: string | null;
    currencyCode?: string | null;
    expiresAt?: string | null;
    updatedAt?: string | null;
    rowVersion?: number | null;
  }>;
  purchaseOrders?: Array<{
    id: string;
    publicCode: string;
    status: string;
    totalAmount?: string | null;
    currencyCode?: string | null;
    updatedAt?: string | null;
  }>;
  shipments?: Array<{
    id: string;
    publicCode: string;
    status: string;
    carrierName?: string | null;
    trackingNumber?: string | null;
    purchaseOrderId?: string;
    updatedAt?: string | null;
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount?: string | null;
    currencyCode?: string | null;
    purchaseOrderId?: string;
    updatedAt?: string | null;
  }>;
  payments?: Array<{
    id: string;
    status: string;
    amount?: string | null;
    invoiceId?: string | null;
    updatedAt?: string | null;
  }>;
};

export type ApiProcurementRequest = {
  id: string;
  publicCode: string;
  status: string;
  lob?: "international" | "integrated_export" | string;
  title: string;
  currencyCode: string;
  notes?: string | null;
  destinationCountryCode?: string | null;
  destinationAddress?: string | null;
  requiredByDate?: string | Date | null;
  budgetAmount?: string | null;
  priority: string;
  restrictedGoodsDeclared: boolean;
  requesterId?: string | null;
  requesterEmail?: string | null;
  requesterName?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  assigneeName?: string | null;
  rowVersion: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  archivedAt?: string | Date | null;
  related?: ApiRequestRelated | null;
  history?: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: string;
    command?: string | null;
    reason?: string | null;
    actorName?: string | null;
    createdAt: string | Date;
  }>;
  items: Array<{
    id: string;
    productVariantId?: string | null;
    description: string;
    quantity: string;
    unit: string;
    targetUnitAmount?: string | null;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    mimeType?: string;
    sizeBytes?: number;
    sizeLabel?: string;
    href: string;
    kind?: string;
    uploadedAt: string | Date;
  }>;
  documentIds?: string[];
};

function apiBase(): string {
  return browserApiBase();
}

function procurementUrl(path = ""): string {
  const base = apiBase();
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  if (!base) return `/api/v1/procurement-requests${normalized}`;
  return `${base}/api/v1/procurement-requests${normalized}`;
}

export class ProcurementApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ProcurementApiError";
    this.status = status;
    this.code = code;
  }
}

async function procurementFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken: string;
    query?: Record<string, string | number | boolean | undefined>;
  },
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${options.accessToken}`,
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let url = procurementUrl(path);
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
      error?: {
        code?: string;
        message?: string;
        details?: Array<{ field?: string; message?: string }>;
      };
      message?: string;
      errors?: Array<{ field?: string; message?: string }>;
    } | null;
    const detail =
      envelope?.error?.details?.[0]?.message ??
      envelope?.errors?.[0]?.message;
    const base =
      envelope?.error?.message ??
      envelope?.message ??
      "We couldn't complete this request.";
    throw new ProcurementApiError(
      detail && detail !== base ? `${base} (${detail})` : base,
      response.status,
      envelope?.error?.code ?? "PROCUREMENT_ERROR",
    );
  }

  if (response.status === 204 || response.status === 205 || body == null) {
    return undefined as T;
  }
  return unwrapEnvelopeData<T>(body);
}

function isoDate(value: string | Date | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    return value.includes("T") ? value : `${value}T00:00:00.000Z`;
  }
  return value.toISOString();
}

export function mapApiProcurementToRecord(
  row: ApiProcurementRequest,
): ProcurementRequestRecord {
  if (!row || typeof row !== "object" || !row.id) {
    throw new ProcurementApiError(
      "We couldn't load this request.",
      502,
      "INVALID_RESPONSE",
    );
  }
  const createdAt =
    typeof row.createdAt === "string"
      ? row.createdAt
      : new Date(row.createdAt).toISOString();
  const updatedAt =
    typeof row.updatedAt === "string"
      ? row.updatedAt
      : new Date(row.updatedAt).toISOString();

  return {
    id: row.id,
    publicCode: row.publicCode,
    title: row.title,
    status: row.status,
    lob: row.lob ?? "international",
    priority: row.priority,
    currencyCode: row.currencyCode,
    notes: row.notes ?? null,
    destinationCountryCode: row.destinationCountryCode ?? null,
    destinationAddress: row.destinationAddress ?? null,
    requiredByDate: isoDate(row.requiredByDate),
    budgetAmount:
      row.budgetAmount != null && row.budgetAmount !== ""
        ? Number(row.budgetAmount)
        : null,
    restrictedGoodsDeclared: row.restrictedGoodsDeclared,
    rowVersion: row.rowVersion,
    requesterName: row.requesterName?.trim() || row.requesterEmail || "You",
    requesterEmail: row.requesterEmail ?? null,
    organizationName: row.organizationName ?? null,
    assigneeName: null,
    createdAt,
    updatedAt,
    items: row.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit,
      targetUnitAmount:
        item.targetUnitAmount != null && item.targetUnitAmount !== ""
          ? Number(item.targetUnitAmount)
          : null,
      productVariantId: item.productVariantId ?? null,
    })),
    timeline: (row.history ?? []).map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      command: event.command,
      reason: event.reason,
      actorName: event.actorName,
      createdAt:
        typeof event.createdAt === "string"
          ? event.createdAt
          : new Date(event.createdAt).toISOString(),
    })),
    comments: [],
    attachments: (row.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      name: attachment.name,
      href: attachment.href.startsWith("http")
        ? attachment.href
        : `${apiBase()}${attachment.href}`,
      kind: attachment.kind || "file",
      sizeLabel: attachment.sizeLabel,
      uploadedAt:
        typeof attachment.uploadedAt === "string"
          ? attachment.uploadedAt
          : new Date(attachment.uploadedAt).toISOString(),
    })),
    internalNotes: [],
    history: (row.history ?? []).map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      command: event.command,
      reason: event.reason,
      actorName: event.actorName,
      createdAt:
        typeof event.createdAt === "string"
          ? event.createdAt
          : new Date(event.createdAt).toISOString(),
    })),
    approvals: [],
    notifications: [],
    activity: [],
    related: row.related ?? null,
  };
}

function documentsUrl(): string {
  const base = apiBase();
  if (!base) return `/api/v1/documents`;
  return `${base}/api/v1/documents`;
}

export type UploadedDocument = {
  id: string;
  name: string;
  href: string;
  kind: string;
  sizeLabel?: string;
  uploadedAt: string | Date;
};

export function sanitizeUploadFiles(files: unknown): File[] {
  const candidates: unknown[] =
    Array.isArray(files)
      ? files
      : typeof files === "object" && files && "length" in files
        ? Array.from(files as ArrayLike<unknown>)
        : [];

  return candidates.filter((value): value is File => {
    if (value == null || typeof value === "string") return false;
    if (typeof value === "object" && "name" in value && "size" in value) {
      const maybeFile = value as Partial<File>;
      return (
        typeof File !== "undefined" &&
        value instanceof File &&
        typeof maybeFile.name === "string" &&
        maybeFile.name.length > 0 &&
        typeof maybeFile.size === "number" &&
        Number.isFinite(maybeFile.size) &&
        maybeFile.size >= 0 &&
        !maybeFile.name.startsWith("blob:")
      );
    }
    return false;
  });
}

function isValidUploadFile(value: unknown): value is File {
  return sanitizeUploadFiles([value]).length > 0;
}

export async function uploadProcurementFiles(
  accessToken: string,
  files: File[],
): Promise<UploadedDocument[]> {
  const validFiles = sanitizeUploadFiles(files).slice(0, 5);
  if (validFiles.length === 0) return [];
  const form = new FormData();
  for (const file of validFiles) {
    form.append("files", file, file.name);
  }
  const response = await sessionFetch(documentsUrl(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
    credentials: "include",
  });
  const body = await parseJson(response);
  if (!response.ok) {
    const envelope = body as {
      error?: { code?: string; message?: string };
      message?: string;
    } | null;
    throw new ProcurementApiError(
      envelope?.error?.message ??
        envelope?.message ??
        "Unable to upload attachments.",
      response.status,
      envelope?.error?.code ?? "UPLOAD_ERROR",
    );
  }
  const envelope = body as Envelope<UploadedDocument[]> | null;
  return envelope?.data ?? [];
}

export async function downloadProcurementDocument(
  accessToken: string,
  documentId: string,
  filename: string,
): Promise<void> {
  const response = await sessionFetch(`${documentsUrl()}/${documentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });
  if (!response.ok) {
    let message = "Unable to download attachment.";
    try {
      const body = (await response.json()) as {
        error?: { message?: string };
        message?: string;
      };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      // keep default
    }
    throw new ProcurementApiError(
      message,
      response.status,
      "DOWNLOAD_ERROR",
    );
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

type CreateSource = ProcurementDraftPatch & {
  internalNotes?: string | undefined;
  documentIds?: string[] | undefined;
  lob?: "international" | "integrated_export";
  submit?: boolean | undefined;
};

export function toCreateBody(payload: CreateSource) {
  const title = (payload.title ?? "").trim();
  const items = (payload.items ?? []).filter(
    (item) => item.description.trim().length >= 2,
  );
  if (title.length < 3) {
    throw new ProcurementApiError(
      "Title must be at least 3 characters.",
      400,
      "VALIDATION_ERROR",
    );
  }
  if (items.length < 1) {
    throw new ProcurementApiError(
      "Add at least one line item with a description.",
      400,
      "VALIDATION_ERROR",
    );
  }

  const country = payload.destinationCountryCode?.trim().toUpperCase();
  const address = payload.destinationAddress?.trim();
  const requiredBy = payload.requiredByDate?.trim();
  const notes = payload.notes?.trim() || undefined;

  return {
    title,
    ...(payload.lob ? { lob: payload.lob } : {}),
    currencyCode: (payload.currencyCode ?? "USD").toUpperCase(),
    ...(notes ? { notes } : {}),
    ...(country && /^[A-Z]{2}$/.test(country)
      ? { destinationCountryCode: country }
      : {}),
    ...(address && address.length >= 5 ? { destinationAddress: address } : {}),
    ...(requiredBy ? { requiredByDate: requiredBy.slice(0, 10) } : {}),
    ...(payload.budgetAmount != null
      ? { budgetAmount: payload.budgetAmount }
      : {}),
    priority: payload.priority ?? "normal",
    restrictedGoodsDeclared: payload.restrictedGoodsDeclared ?? false,
    ...(payload.documentIds && payload.documentIds.length > 0
      ? { documentIds: payload.documentIds }
      : {}),
    items: items.map((item) => ({
      ...(item.productVariantId &&
      /^[0-9a-f-]{36}$/i.test(item.productVariantId)
        ? { productVariantId: item.productVariantId }
        : {}),
      description: item.description.trim(),
      quantity: item.quantity,
      unit: (item.unit || "pcs").trim().slice(0, 32),
      ...(item.targetUnitAmount != null
        ? { targetUnitAmount: item.targetUnitAmount }
        : {}),
    })),
    ...(payload.submit ? { submit: true } : {}),
  };
}

export function toUpdateBody(patch: ProcurementDraftPatch) {
  const body: Record<string, unknown> = {
    rowVersion: patch.rowVersion,
  };
  if (patch.title !== undefined) body.title = patch.title.trim();
  if (patch.notes !== undefined) body.notes = patch.notes ?? undefined;
  if (patch.destinationCountryCode !== undefined) {
    const country = patch.destinationCountryCode?.trim().toUpperCase();
    body.destinationCountryCode =
      country && /^[A-Z]{2}$/.test(country) ? country : undefined;
  }
  if (patch.destinationAddress !== undefined) {
    body.destinationAddress = patch.destinationAddress?.trim() || undefined;
  }
  if (patch.requiredByDate !== undefined) {
    body.requiredByDate = patch.requiredByDate
      ? patch.requiredByDate.slice(0, 10)
      : undefined;
  }
  if (patch.budgetAmount !== undefined) {
    body.budgetAmount = patch.budgetAmount ?? undefined;
  }
  if (patch.priority !== undefined) body.priority = patch.priority;
  if (patch.currencyCode !== undefined) {
    body.currencyCode = patch.currencyCode.toUpperCase();
  }
  if (patch.restrictedGoodsDeclared !== undefined) {
    body.restrictedGoodsDeclared = patch.restrictedGoodsDeclared;
  }
  if (patch.items !== undefined) {
    body.items = patch.items.map((item) => ({
      ...(item.productVariantId &&
      /^[0-9a-f-]{36}$/i.test(item.productVariantId)
        ? { productVariantId: item.productVariantId }
        : {}),
      description: item.description.trim(),
      quantity: item.quantity,
      unit: (item.unit || "pcs").trim().slice(0, 32),
      ...(item.targetUnitAmount != null
        ? { targetUnitAmount: item.targetUnitAmount }
        : {}),
    }));
  }
  if (patch.documentIds !== undefined) {
    body.documentIds = patch.documentIds.slice(0, 5);
  }
  return body;
}

export async function listProcurementRequests(
  accessToken: string,
  query?: {
    pageSize?: number;
    status?: string;
    q?: string;
    priority?: string;
    includeArchived?: boolean;
    lob?: "international" | "integrated_export" | "all";
  },
): Promise<ProcurementRequestRecord[]> {
  const rows = await procurementFetch<ApiProcurementRequest[]>("", {
    method: "GET",
    accessToken,
    query: {
      pageSize: query?.pageSize ?? 100,
      status: query?.status,
      q: query?.q,
      priority: query?.priority,
      includeArchived: query?.includeArchived,
      lob: query?.lob,
      sort: "-createdAt",
    },
  });
  return rows.map(mapApiProcurementToRecord);
}

export async function getProcurementRequest(
  accessToken: string,
  requestId: string,
): Promise<ProcurementRequestRecord> {
  const row = await procurementFetch<ApiProcurementRequest>(`/${requestId}`, {
    method: "GET",
    accessToken,
  });
  return mapApiProcurementToRecord(row);
}

export async function createProcurementRequest(
  accessToken: string,
  payload: CreateSource,
): Promise<ProcurementRequestRecord> {
  const row = await procurementFetch<ApiProcurementRequest>("", {
    method: "POST",
    accessToken,
    body: toCreateBody(payload),
  });
  return mapApiProcurementToRecord(row);
}

export async function updateProcurementRequest(
  accessToken: string,
  requestId: string,
  patch: ProcurementDraftPatch,
): Promise<ProcurementRequestRecord> {
  const row = await procurementFetch<ApiProcurementRequest>(`/${requestId}`, {
    method: "PATCH",
    accessToken,
    body: toUpdateBody(patch),
  });
  return mapApiProcurementToRecord(row);
}

export async function transitionProcurementRequest(
  accessToken: string,
  requestId: string,
  command: ProcurementCommand,
  meta: { rowVersion: number; reason?: string },
): Promise<ProcurementRequestRecord> {
  const row = await procurementFetch<ApiProcurementRequest | undefined>(
    `/${requestId}/transitions`,
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
  if (!row) {
    return getProcurementRequest(accessToken, requestId);
  }
  return mapApiProcurementToRecord(row);
}

export async function deleteCancelledProcurementRequest(
  accessToken: string,
  requestId: string,
  rowVersion: number,
): Promise<void> {
  await procurementFetch<null>(`/${requestId}`, {
    method: "DELETE",
    accessToken,
    body: { rowVersion },
  });
}

export async function archiveProcurementRequest(
  accessToken: string,
  requestId: string,
  rowVersion: number,
): Promise<ProcurementRequestRecord> {
  const row = await procurementFetch<ApiProcurementRequest>(
    `/${requestId}/archive`,
    {
      method: "POST",
      accessToken,
      body: { rowVersion },
    },
  );
  return mapApiProcurementToRecord(row);
}

export async function duplicateProcurementRequest(
  accessToken: string,
  requestId: string,
): Promise<ProcurementRequestRecord> {
  const row = await procurementFetch<ApiProcurementRequest>(
    `/${requestId}/duplicate`,
    {
      method: "POST",
      accessToken,
      body: {},
    },
  );
  return mapApiProcurementToRecord(row);
}

export async function createAndMaybeSubmit(
  accessToken: string,
  payload: RequestWizardSubmitPayload,
): Promise<ProcurementRequestRecord> {
  const files = (payload.attachmentFiles ?? []).filter(isValidUploadFile);
  const uploaded =
    files.length > 0
      ? await uploadProcurementFiles(accessToken, files)
      : [];
  const documentIds = uploaded.map((doc) => doc.id);
  if (payload.submit) {
    const country = payload.destinationCountryCode?.trim().toUpperCase() ?? "";
    const address = payload.destinationAddress?.trim() ?? "";
    if (!/^[A-Z]{2}$/.test(country) || address.length < 5) {
      throw new ProcurementApiError(
        "A destination country and address are required before submission.",
        422,
        "VALIDATION_ERROR",
      );
    }
  }
  let record = await createProcurementRequest(accessToken, {
    ...payload,
    documentIds,
    submit: payload.submit,
  });
  if (payload.submit && record.status === "draft") {
    record = await transitionProcurementRequest(
      accessToken,
      record.id,
      "submit",
      { rowVersion: record.rowVersion },
    );
  }
  return record;
}

export async function requireProcurementToken(
  ensureSession: () => Promise<string | null>,
): Promise<string> {
  const token = getAccessToken() ?? (await ensureSession());
  if (!token) {
    throw new ProcurementApiError(
      "Sign in again to manage procurement requests.",
      401,
      "UNAUTHENTICATED",
    );
  }
  return token;
}
