import { browserApiBase } from "../lib/api-origin.js";

export type CopilotResponse = {
  workflow: "product" | "request" | "quotation" | "order";
  mode: "explain" | "assist" | "recommend";
  answer: string;
  confidence: "high" | "moderate" | "low";
  citations: Array<{ id: string; label: string; kind: string; href?: string }>;
  assumptions: string[];
  missingData: string[];
  nextActions: string[];
  structured: Record<string, unknown>;
  provider: string;
  model: string;
};

function apiBase(): string {
  return browserApiBase();
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
  accessToken: string,
  body?: unknown,
): Promise<T> {
  const base = apiBase();
  const url = `${base}/api/v1${path}`;
  const response = await fetch(url, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json()) as {
    data?: T;
    error?: { message?: string; code?: string };
    message?: string;
  };
  if (!response.ok) {
    throw new CopilotApiError(
      payload.error?.message ?? payload.message ?? "Copilot request failed.",
      response.status,
      payload.error?.code ?? "COPILOT_ERROR",
    );
  }
  return payload.data as T;
}

export function adviseOrder(
  accessToken: string,
  body: {
    shipmentId?: string;
    purchaseOrderId?: string;
    focus?: "delays" | "delivery" | "actions" | "all";
  },
): Promise<CopilotResponse> {
  return copilotFetch("/ai/copilot/orders/advise", accessToken, body);
}

export function explainQuotation(
  accessToken: string,
  quotationId: string,
  body: Record<string, unknown> = {},
): Promise<CopilotResponse> {
  return copilotFetch(
    `/ai/copilot/quotations/${quotationId}/explain`,
    accessToken,
    body,
  );
}
