export const CLARIFICATION_FIELD_KEYS = [
  "product",
  "quantity",
  "unit",
  "specification",
  "destination",
  "requiredBy",
  "contact",
  "organisation",
  "media",
  "notes",
  "custom",
] as const;

export type ClarificationFieldKey = (typeof CLARIFICATION_FIELD_KEYS)[number];

export const CLARIFICATION_FIELD_LABELS: Record<ClarificationFieldKey, string> = {
  product: "Product selection",
  quantity: "Quantity",
  unit: "Quantity unit",
  specification: "Product specification",
  destination: "Delivery location",
  requiredBy: "Delivery date",
  contact: "Contact information",
  organisation: "Organisation information",
  media: "Supporting media or document",
  notes: "Notes",
  custom: "Custom requirement",
};

/** @deprecated Use CLARIFICATION_FIELD_LABELS */
export const CLARIFICATION_AREAS = Object.values(CLARIFICATION_FIELD_LABELS);

export type ClarificationArea = (typeof CLARIFICATION_AREAS)[number];

export type ClarificationItem = {
  fieldKey: ClarificationFieldKey;
  label: string;
  currentValue: string;
  prompt: string;
};

export type ParsedClarification = {
  area: string | null;
  question: string;
  items: ClarificationItem[];
};

const GENERIC =
  /^(more\s+clarification(\s+is\s+required)?\.?|please\s+clarify\.?|clarification\s+required\.?|n\/?a|\.+)$/i;

const PAYLOAD_PREFIX = "CLARIFY_V1:";

export type ClarificationRequestSnapshot = {
  title?: string | null | undefined;
  notes?: string | null | undefined;
  destinationAddress?: string | null | undefined;
  destinationCountryCode?: string | null | undefined;
  requiredByDate?: string | null | undefined;
  requesterName?: string | null | undefined;
  requesterEmail?: string | null | undefined;
  organizationName?: string | null | undefined;
  items?: ReadonlyArray<{
    description?: string | null;
    quantity?: string | number | null;
    unit?: string | null;
  }>;
  attachmentsCount?: number;
};

export function clarificationFieldsFromRequest(
  request: ClarificationRequestSnapshot,
): Array<{ fieldKey: ClarificationFieldKey; label: string; currentValue: string }> {
  const first = request.items?.[0];
  return [
    {
      fieldKey: "product",
      label: CLARIFICATION_FIELD_LABELS.product,
      currentValue: first?.description?.trim() || "Not provided",
    },
    {
      fieldKey: "quantity",
      label: CLARIFICATION_FIELD_LABELS.quantity,
      currentValue:
        first?.quantity != null ? String(first.quantity) : "Not provided",
    },
    {
      fieldKey: "unit",
      label: CLARIFICATION_FIELD_LABELS.unit,
      currentValue: first?.unit?.trim() || "Not provided",
    },
    {
      fieldKey: "specification",
      label: CLARIFICATION_FIELD_LABELS.specification,
      currentValue: request.title?.trim() || "Not provided",
    },
    {
      fieldKey: "destination",
      label: CLARIFICATION_FIELD_LABELS.destination,
      currentValue: [request.destinationAddress, request.destinationCountryCode]
        .filter(Boolean)
        .join(", ") || "Not provided",
    },
    {
      fieldKey: "requiredBy",
      label: CLARIFICATION_FIELD_LABELS.requiredBy,
      currentValue: request.requiredByDate?.slice(0, 10) || "Not provided",
    },
    {
      fieldKey: "contact",
      label: CLARIFICATION_FIELD_LABELS.contact,
      currentValue:
        [request.requesterName, request.requesterEmail].filter(Boolean).join(" · ") ||
        "Not provided",
    },
    {
      fieldKey: "organisation",
      label: CLARIFICATION_FIELD_LABELS.organisation,
      currentValue: request.organizationName?.trim() || "Not provided",
    },
    {
      fieldKey: "media",
      label: CLARIFICATION_FIELD_LABELS.media,
      currentValue:
        (request.attachmentsCount ?? 0) > 0
          ? `${request.attachmentsCount} file(s) attached`
          : "No files attached",
    },
    {
      fieldKey: "notes",
      label: CLARIFICATION_FIELD_LABELS.notes,
      currentValue: request.notes?.trim() || "Not provided",
    },
    {
      fieldKey: "custom",
      label: CLARIFICATION_FIELD_LABELS.custom,
      currentValue: "Not provided",
    },
  ];
}

export function encodeClarificationItems(items: readonly ClarificationItem[]): string {
  return `${PAYLOAD_PREFIX}${JSON.stringify({ items })}`;
}

export function formatClarificationReason(area: string, question: string): string {
  return `[${area.trim()}]\n${question.trim()}`;
}

export function parseClarificationReason(reason?: string | null): ParsedClarification | null {
  const value = reason?.trim();
  if (!value) return null;
  if (value.startsWith(PAYLOAD_PREFIX)) {
    try {
      const parsed = JSON.parse(value.slice(PAYLOAD_PREFIX.length)) as {
        items?: ClarificationItem[];
      };
      const items = Array.isArray(parsed.items) ? parsed.items : [];
      return {
        area: items[0]?.label ?? null,
        question: items.map((item) => item.prompt).join("\n"),
        items,
      };
    } catch {
      return { area: null, question: value, items: [] };
    }
  }
  const match = value.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
  if (match) {
    const area = match[1]?.trim() || null;
    const question = (match[2] ?? "").trim() || value;
    return {
      area,
      question,
      items: [
        {
          fieldKey: "custom",
          label: area ?? CLARIFICATION_FIELD_LABELS.custom,
          currentValue: "",
          prompt: question,
        },
      ],
    };
  }
  return { area: null, question: value, items: [] };
}

export function isMeaningfulClarificationQuestion(question: string): boolean {
  const value = question.trim();
  return value.length >= 12 && !GENERIC.test(value);
}
