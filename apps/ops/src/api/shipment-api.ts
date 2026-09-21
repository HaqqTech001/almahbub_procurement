import { safeErrorMessage } from "@hamd/ui/auth";
import type {
  ShipmentCommand,
  ShipmentConfirmDeliveryInput,
  ShipmentCreateInput,
  ShipmentHistoryEvent,
  ShipmentRecord,
  ShipmentTimelineEvent,
} from "@hamd/ui/shipments";

import { getAccessToken } from "../auth/session/token-store.js";
import { sessionFetch } from "../auth/session/session-http.js";
import { browserApiBase } from "../lib/api-origin.js";

type Envelope<T> = { data: T; error?: { code?: string; message?: string } };

export type ApiShipment = {
  id: string;
  purchaseOrderId: string;
  purchaseOrderCode?: string;
  publicCode: string;
  status: string;
  carrierName?: string | null;
  trackingNumber?: string | null;
  transportMode?: string | null;
  estimatedArrivalAt?: string | null;
  actualDeliveryAt?: string | null;
  originLabel?: string | null;
  destinationLabel?: string | null;
  recipientName?: string | null;
  confirmedAt?: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  milestones?: Array<{
    id: string;
    type: string;
    label?: string;
    confidence: string;
    occurredAt?: string | null;
    estimatedAt?: string | null;
    location?: string | null;
  }>;
  timeline?: Array<{
    id: string;
    label: string;
    detail?: string | null;
    at: string;
    kind?: string;
  }>;
  documents?: Array<{
    id: string;
    documentId?: string;
    name: string;
    href: string;
    role?: string;
    uploadedAt: string;
  }>;
  history?: Array<{
    id: string;
    fromStatus?: string | null;
    toStatus: string;
    command: string;
    reason?: string | null;
    actorName?: string | null;
    createdAt: string;
  }>;
  proofOfDelivery?: {
    confirmed: boolean;
    recipientName?: string | null;
    confirmedAt?: string | null;
    confirmedByName?: string | null;
    notes?: string | null;
    evidenceHref?: string | null;
    evidenceLabel?: string | null;
  };
  map?: {
    label: string;
    latitude?: number | null;
    longitude?: number | null;
    region?: string | null;
  };
};

function apiBase(): string {
  return browserApiBase();
}

function shipmentsUrl(path = ""): string {
  const base = apiBase();
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  if (!base) return `/api/v1/shipments${normalized}`;
  return `${base}/api/v1/shipments${normalized}`;
}

export class ShipmentApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number, code: string) {
    super(safeErrorMessage(message, status));
    this.name = "ShipmentApiError";
    this.status = status;
    this.code = code;
  }
}

async function shipmentFetch<T>(
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
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let url = shipmentsUrl(path);
  if (options.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await sessionFetch(url, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
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
    throw new ShipmentApiError(
      envelope?.error?.message ??
        envelope?.message ??
        "Shipment request failed.",
      response.status,
      envelope?.error?.code ?? "SHIPMENT_ERROR",
    );
  }

  const envelope = body as Envelope<T> | null;
  if (envelope && "data" in envelope) return envelope.data;
  return body as T;
}

function iso(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  return typeof value === "string" ? value : new Date(value).toISOString();
}

export function mapApiShipmentToRecord(row: ApiShipment): ShipmentRecord {
  return {
    id: row.id,
    publicCode: row.publicCode,
    status: row.status,
    rowVersion: row.rowVersion,
    purchaseOrderId: row.purchaseOrderId,
    purchaseOrderCode: row.purchaseOrderCode,
    carrierName: row.carrierName,
    trackingNumber: row.trackingNumber,
    transportMode: row.transportMode,
    estimatedArrivalAt: iso(row.estimatedArrivalAt),
    actualDeliveryAt: iso(row.actualDeliveryAt),
    originLabel: row.originLabel ?? null,
    destinationLabel: row.destinationLabel ?? null,
    createdAt: iso(row.createdAt) ?? new Date().toISOString(),
    updatedAt: iso(row.updatedAt) ?? new Date().toISOString(),
    milestones: (row.milestones ?? []).map((milestone) => ({
      id: milestone.id,
      type: milestone.type,
      label:
        milestone.label ??
        milestone.type.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      confidence: milestone.confidence,
      occurredAt: iso(milestone.occurredAt),
      estimatedAt: iso(milestone.estimatedAt),
      location: milestone.location,
    })),
    timeline: (row.timeline ?? []) as ShipmentTimelineEvent[],
    documents: (row.documents ?? []).map((doc) => ({
      id: doc.id,
      documentId: doc.documentId,
      name: doc.name,
      href: doc.href,
      role: doc.role,
      uploadedAt: iso(doc.uploadedAt) ?? new Date().toISOString(),
    })),
    history: (row.history ?? []) as ShipmentHistoryEvent[],
    proofOfDelivery: row.proofOfDelivery ?? { confirmed: false },
    map: row.map ?? {
      label: `Shipment ${row.publicCode}`,
      latitude: null,
      longitude: null,
      region: null,
    },
  };
}

export async function listShipments(
  accessToken: string,
  query?: { pageSize?: number; status?: string },
): Promise<ShipmentRecord[]> {
  const rows = await shipmentFetch<ApiShipment[]>("/", {
    method: "GET",
    accessToken,
    query: {
      pageSize: query?.pageSize ?? 100,
      status: query?.status,
    },
  });
  return rows.map(mapApiShipmentToRecord);
}

export async function getShipment(
  accessToken: string,
  shipmentId: string,
): Promise<ShipmentRecord> {
  return mapApiShipmentToRecord(
    await shipmentFetch<ApiShipment>(`/${shipmentId}`, {
      method: "GET",
      accessToken,
    }),
  );
}

export async function createShipment(
  accessToken: string,
  input: ShipmentCreateInput,
): Promise<ShipmentRecord> {
  const body: Record<string, unknown> = {
    purchaseOrderId: input.purchaseOrderId,
  };
  if (input.carrierName) body.carrierName = input.carrierName;
  if (input.trackingNumber) body.trackingNumber = input.trackingNumber;
  if (input.transportMode) body.transportMode = input.transportMode;
  if (input.estimatedArrivalAt) {
    body.estimatedArrivalAt = input.estimatedArrivalAt;
  }
  return mapApiShipmentToRecord(
    await shipmentFetch<ApiShipment>("/", {
      method: "POST",
      accessToken,
      body,
    }),
  );
}

export async function transitionShipment(
  accessToken: string,
  shipmentId: string,
  command: ShipmentCommand,
  meta: { rowVersion: number; reason?: string },
): Promise<ShipmentRecord> {
  return mapApiShipmentToRecord(
    await shipmentFetch<ApiShipment>(`/${shipmentId}/transitions`, {
      method: "POST",
      accessToken,
      body: {
        command,
        rowVersion: meta.rowVersion,
        ...(meta.reason ? { reason: meta.reason } : {}),
      },
    }),
  );
}

export async function confirmShipmentDelivery(
  accessToken: string,
  shipmentId: string,
  input: ShipmentConfirmDeliveryInput,
  meta: { rowVersion: number },
): Promise<ShipmentRecord> {
  return mapApiShipmentToRecord(
    await shipmentFetch<ApiShipment>(`/${shipmentId}/confirm-delivery`, {
      method: "POST",
      accessToken,
      body: {
        rowVersion: meta.rowVersion,
        recipientName: input.recipientName,
        evidenceDocumentIds: input.evidenceDocumentIds,
        ...(input.notes ? { note: input.notes } : {}),
      },
    }),
  );
}

export async function linkShipmentDocument(
  accessToken: string,
  shipmentId: string,
  input: { documentId: string; role: string },
): Promise<ShipmentRecord> {
  return mapApiShipmentToRecord(
    await shipmentFetch<ApiShipment>(`/${shipmentId}/documents`, {
      method: "POST",
      accessToken,
      body: input,
    }),
  );
}

export async function requireShipmentToken(
  ensureSession: () => Promise<string | null>,
): Promise<string> {
  const token = getAccessToken() ?? (await ensureSession());
  if (!token) {
    throw new ShipmentApiError(
      "Sign in again to manage shipments.",
      401,
      "UNAUTHENTICATED",
    );
  }
  return token;
}
