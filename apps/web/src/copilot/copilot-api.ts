import { browserApiBase } from "../lib/api-origin.js";

export type CopilotMode = "explain" | "assist" | "recommend";

export type CopilotCitation = {
  id: string;
  label: string;
  kind: string;
  href?: string;
};

export type CopilotResponse = {
  workflow: "product" | "request" | "quotation" | "order";
  mode: CopilotMode;
  answer: string;
  confidence: "high" | "moderate" | "low";
  citations: CopilotCitation[];
  assumptions: string[];
  missingData: string[];
  nextActions: string[];
  structured: Record<string, unknown>;
  provider: string;
  model: string;
};

export type CopilotStatus = {
  configured: boolean;
  provider: string | null;
  model: string | null;
  workflows: string[];
};

function apiBase(): string {
  return browserApiBase();
}

function apiUrl(path: string): string {
  const base = apiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return `/api/v1${normalized}`;
  return `${base}/api/v1${normalized}`;
}

export class CopilotApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "COPILOT_ERROR") {
    super(message);
    this.name = "CopilotApiError";
    this.status = status;
    this.code = code;
  }
}

async function copilotFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string | null;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(apiUrl(path), {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  const text = await response.text();
  type Envelope = {
    data?: T;
    error?: { message?: string; code?: string };
    message?: string;
  };
  let payload: Envelope | null = null;
  try {
    payload = text ? (JSON.parse(text) as Envelope) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new CopilotApiError(
      payload?.error?.message ?? payload?.message ?? "Copilot request failed.",
      response.status,
      payload?.error?.code ?? "COPILOT_ERROR",
    );
  }

  return (payload?.data ?? (payload as unknown as T)) as T;
}

export function getCopilotStatus(): Promise<CopilotStatus> {
  return copilotFetch("/ai/copilot/status");
}

export function adviseProduct(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<CopilotResponse> {
  return copilotFetch("/ai/copilot/products/advise", {
    method: "POST",
    accessToken,
    body,
  });
}

export function guideRequestDraft(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<CopilotResponse> {
  return copilotFetch("/ai/copilot/requests/draft-guidance", {
    method: "POST",
    accessToken,
    body,
  });
}

export function guideRequest(
  accessToken: string,
  requestId: string,
  body: Record<string, unknown> = {},
): Promise<CopilotResponse> {
  return copilotFetch(`/ai/copilot/requests/${requestId}/guidance`, {
    method: "POST",
    accessToken,
    body,
  });
}

export function explainQuotation(
  accessToken: string,
  quotationId: string,
  body: Record<string, unknown> = {},
): Promise<CopilotResponse> {
  return copilotFetch(`/ai/copilot/quotations/${quotationId}/explain`, {
    method: "POST",
    accessToken,
    body,
  });
}

export function compareQuotations(
  accessToken: string,
  body: {
    quotationIds: string[];
    focus?: "price" | "lead_time" | "commercial_terms" | "overall";
  },
): Promise<CopilotResponse> {
  return copilotFetch("/ai/copilot/quotations/compare", {
    method: "POST",
    accessToken,
    body,
  });
}

export function adviseOrder(
  accessToken: string,
  body: {
    shipmentId?: string;
    purchaseOrderId?: string;
    focus?: "delays" | "delivery" | "actions" | "all";
    question?: string;
  },
): Promise<CopilotResponse> {
  return copilotFetch("/ai/copilot/orders/advise", {
    method: "POST",
    accessToken,
    body,
  });
}
