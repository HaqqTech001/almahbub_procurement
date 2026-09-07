/** Future-ready AI quotation comparison - no mock inference. */

export type QuotationAiComparisonRequest = {
  readonly quotationIds: readonly string[];
  readonly focus?:
    | "price"
    | "lead_time"
    | "commercial_terms"
    | "overall"
    | undefined;
};

export type QuotationAiComparisonInsight = {
  readonly quotationId: string;
  readonly score?: number | undefined;
  readonly strengths: readonly string[];
  readonly risks: readonly string[];
  readonly summary: string;
};

export type QuotationAiComparisonResult = {
  readonly generatedAt: string;
  readonly model?: string | undefined;
  readonly recommendationQuotationId?: string | null | undefined;
  readonly insights: readonly QuotationAiComparisonInsight[];
  readonly narrative: string;
};

/**
 * Hosts inject a real AI gateway when available.
 * Until then, `compare` stays undefined and the UI shows “AI not configured”.
 */
export type QuotationAiComparisonAdapter = {
  readonly compare?: (
    request: QuotationAiComparisonRequest,
  ) => Promise<QuotationAiComparisonResult>;
};

export type QuotationAiComparisonState =
  | { status: "idle" }
  | { status: "unavailable"; reason: string }
  | { status: "loading" }
  | { status: "ready"; result: QuotationAiComparisonResult }
  | { status: "error"; message: string };

export function createUnavailableAiAdapter(
  reason = "AI quotation comparison is not configured in this environment.",
): QuotationAiComparisonAdapter {
  return {
    compare: async () => {
      throw new Error(reason);
    },
  };
}

export async function runQuotationAiComparison(
  adapter: QuotationAiComparisonAdapter | null | undefined,
  request: QuotationAiComparisonRequest,
): Promise<QuotationAiComparisonState> {
  if (!adapter?.compare) {
    return {
      status: "unavailable",
      reason:
        "AI quotation comparison is not configured. Connect a model gateway to enable it.",
    };
  }
  if (request.quotationIds.length < 2) {
    return {
      status: "error",
      message: "Select at least two quotations to compare with AI.",
    };
  }
  try {
    const result = await adapter.compare(request);
    return { status: "ready", result };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "AI comparison failed.",
    };
  }
}
