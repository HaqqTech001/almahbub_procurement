/** AI Procurement Assistant contracts - presentational; hosts inject LLM/RAG later. */

export const ASSISTANT_MODES = ["explain", "assist", "recommend"] as const;
export type AssistantMode = (typeof ASSISTANT_MODES)[number];

export const ASSISTANT_CONFIDENCE = [
  "high",
  "moderate",
  "low",
  "unavailable",
] as const;
export type AssistantConfidence = (typeof ASSISTANT_CONFIDENCE)[number];

/** Mission support suggestion kinds. */
export const ASSISTANT_SUGGESTION_KINDS = [
  "product_suggestion",
  "supplier_suggestion",
  "alternative_product",
  "specification_explanation",
  "budget_suggestion",
  "lead_time_explanation",
  "document_summary",
  "quotation_summary",
  "procurement_guidance",
  "faq_answer",
] as const;
export type AssistantSuggestionKind =
  (typeof ASSISTANT_SUGGESTION_KINDS)[number];

/** Future-ready capability slots (LLM / RAG / Voice / Vision / Memory). */
export const ASSISTANT_CAPABILITIES = [
  "llm",
  "rag",
  "voice",
  "vision",
  "memory",
] as const;
export type AssistantCapability = (typeof ASSISTANT_CAPABILITIES)[number];

export type AssistantCapabilityAvailability =
  | "active"
  | "stub"
  | "future";

export type AssistantCapabilityDescriptor = {
  id: AssistantCapability;
  label: string;
  description: string;
  availability: AssistantCapabilityAvailability;
};

export const ASSISTANT_CAPABILITY_DESCRIPTORS: AssistantCapabilityDescriptor[] =
  [
    {
      id: "llm",
      label: "LLM",
      description: "Host-injected language model for explain / assist / recommend",
      availability: "active",
    },
    {
      id: "rag",
      label: "RAG",
      description: "Retrieval-augmented answers with cited organization sources",
      availability: "active",
    },
    {
      id: "voice",
      label: "Voice",
      description: "Speech input / readout - reserved for a future release",
      availability: "future",
    },
    {
      id: "vision",
      label: "Vision",
      description: "Image / document visual understanding - future",
      availability: "future",
    },
    {
      id: "memory",
      label: "Conversation memory",
      description:
        "Session-scoped thread retained in UI; durable org memory is host-injected",
      availability: "stub",
    },
  ];

export type AssistantCitation = {
  id: string;
  label: string;
  href?: string | undefined;
  kind?: string | undefined;
};

export type AssistantSuggestion = {
  id: string;
  kind: AssistantSuggestionKind;
  title: string;
  summary: string;
  mode: AssistantMode;
  confidence: AssistantConfidence;
  confidenceReason?: string | undefined;
  citations: AssistantCitation[];
  assumptions?: string[] | undefined;
  missingData?: string[] | undefined;
  nextActions?: string[] | undefined;
  href?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
};

export type AssistantMessageRole = "user" | "assistant" | "system";

export type AssistantMessage = {
  id: string;
  role: AssistantMessageRole;
  content: string;
  createdAt: string;
  mode?: AssistantMode | undefined;
  confidence?: AssistantConfidence | undefined;
  suggestionIds?: string[] | undefined;
  citations?: AssistantCitation[] | undefined;
};

export type AssistantContext = {
  organizationId?: string | undefined;
  page?: string | undefined;
  recordType?: string | undefined;
  recordId?: string | undefined;
  recordCode?: string | undefined;
};

export type AssistantAskInput = {
  prompt: string;
  mode?: AssistantMode | undefined;
  kind?: AssistantSuggestionKind | undefined;
  context?: AssistantContext | undefined;
  /** Session conversation memory for host LLM/RAG (excludes system). */
  memory?: AssistantMessage[] | undefined;
};

export type AssistantAskResult = {
  message: AssistantMessage;
  suggestions?: AssistantSuggestion[] | undefined;
};

export type AssistantSessionFilters = {
  query: string;
  kinds: string[];
  mode: "all" | AssistantMode;
};

export const emptyAssistantFilters = (): AssistantSessionFilters => ({
  query: "",
  kinds: [],
  mode: "all",
});

export function assistantModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    explain: "Explain",
    assist: "Assist",
    recommend: "Recommend",
  };
  return labels[mode] ?? mode;
}

export function assistantConfidenceLabel(confidence: string): string {
  const labels: Record<string, string> = {
    high: "High confidence",
    moderate: "Moderate confidence",
    low: "Low confidence",
    unavailable: "Evidence unavailable",
  };
  return labels[confidence] ?? confidence;
}

export function assistantSuggestionKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    product_suggestion: "Product suggestions",
    supplier_suggestion: "Recommend suppliers",
    alternative_product: "Suggest alternatives",
    specification_explanation: "Explain product specifications",
    budget_suggestion: "Budget guidance",
    lead_time_explanation: "Lead-time guidance",
    document_summary: "Summarize documents",
    quotation_summary: "Summarize quotations",
    procurement_guidance: "Explain procurement steps",
    faq_answer: "Answer FAQs",
  };
  return labels[kind] ?? kind.replaceAll("_", " ");
}

export function assistantCapabilityLabel(id: string): string {
  return (
    ASSISTANT_CAPABILITY_DESCRIPTORS.find((c) => c.id === id)?.label ??
    id.toUpperCase()
  );
}

export function filterAssistantSuggestions(
  rows: AssistantSuggestion[],
  filters: AssistantSessionFilters,
): AssistantSuggestion[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.mode !== "all" && row.mode !== filters.mode) return false;
    if (filters.kinds.length && !filters.kinds.includes(row.kind)) return false;
    if (!q) return true;
    const hay = [
      row.title,
      row.summary,
      assistantSuggestionKindLabel(row.kind),
      ...row.citations.map((c) => c.label),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function groupSuggestionsByKind(
  rows: AssistantSuggestion[],
): Array<{ kind: AssistantSuggestionKind | string; label: string; items: AssistantSuggestion[] }> {
  const map = new Map<string, AssistantSuggestion[]>();
  for (const row of rows) {
    const list = map.get(row.kind) ?? [];
    list.push(row);
    map.set(row.kind, list);
  }
  return ASSISTANT_SUGGESTION_KINDS.filter((kind) => map.has(kind)).map(
    (kind) => ({
      kind,
      label: assistantSuggestionKindLabel(kind),
      items: map.get(kind) ?? [],
    }),
  );
}
