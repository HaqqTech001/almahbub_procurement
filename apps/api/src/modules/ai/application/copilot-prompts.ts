import { AppError } from "../../../lib/app-error.js";

export type CopilotCitation = {
  id: string;
  label: string;
  kind: string;
  href?: string | undefined;
};

export type CopilotResponse = {
  workflow: "product" | "request" | "quotation" | "order";
  mode: "explain" | "assist" | "recommend";
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

const SYSTEM_PREAMBLE = `You are the Almahbub International AI Procurement Copilot.
You assist inside procurement workflows. You do NOT execute commercial actions.
Rules:
- Use ONLY the provided record context. Never invent prices, lead times, stock, customs, or supplier facts that are not in context.
- If evidence is incomplete, say so in missingData and lower confidence.
- Prefer actionable next steps a buyer or ops user can take in the product.
- Respond with a single JSON object matching the schema in the user message.
- Do not wrap JSON in markdown fences.`;

export function buildSystemPrompt(): string {
  return SYSTEM_PREAMBLE;
}

export function responseJsonSchemaHint(workflow: string): string {
  return `Return JSON with keys:
{
  "answer": string,
  "confidence": "high" | "moderate" | "low",
  "assumptions": string[],
  "missingData": string[],
  "nextActions": string[],
  "structured": object  // workflow-specific fields for ${workflow}
}`;
}

export function parseCopilotJson(content: string): {
  answer: string;
  confidence: "high" | "moderate" | "low";
  assumptions: string[];
  missingData: string[];
  nextActions: string[];
  structured: Record<string, unknown>;
} {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        throw new AppError({
          statusCode: 502,
          code: "AI_RESPONSE_INVALID",
          message: "The LLM returned a non-JSON response.",
        });
      }
    } else {
      throw new AppError({
        statusCode: 502,
        code: "AI_RESPONSE_INVALID",
        message: "The LLM returned a non-JSON response.",
      });
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new AppError({
      statusCode: 502,
      code: "AI_RESPONSE_INVALID",
      message: "The LLM returned an unexpected response shape.",
    });
  }

  const row = parsed as Record<string, unknown>;
  const confidenceRaw = String(row.confidence ?? "moderate");
  const confidence =
    confidenceRaw === "high" ||
    confidenceRaw === "moderate" ||
    confidenceRaw === "low"
      ? confidenceRaw
      : "moderate";

  return {
    answer: String(row.answer ?? "").trim() || "No answer produced.",
    confidence,
    assumptions: asStringArray(row.assumptions),
    missingData: asStringArray(row.missingData),
    nextActions: asStringArray(row.nextActions),
    structured:
      row.structured && typeof row.structured === "object"
        ? (row.structured as Record<string, unknown>)
        : {},
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .slice(0, 20);
}
