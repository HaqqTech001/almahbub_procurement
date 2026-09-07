/**
 * Provider-agnostic LLM gateway - workflows never import a vendor SDK.
 */

export type LlmMessage = {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
};

export type LlmCompletionRequest = {
  readonly messages: readonly LlmMessage[];
  readonly temperature?: number;
  readonly maxTokens?: number;
  /** Hint for structured JSON replies. */
  readonly responseFormat?: "text" | "json";
};

export type LlmCompletionResult = {
  readonly provider: string;
  readonly model: string;
  readonly content: string;
  readonly   usage?: {
    readonly promptTokens?: number | undefined;
    readonly completionTokens?: number | undefined;
  };
};

export interface LlmProvider {
  readonly id: string;
  readonly model: string;
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResult>;
}

export type LlmProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "azure_openai";

export class LlmProviderError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    message: string,
    options: { code?: string; statusCode?: number } = {},
  ) {
    super(message);
    this.name = "LlmProviderError";
    this.code = options.code ?? "LLM_PROVIDER_ERROR";
    this.statusCode = options.statusCode ?? 502;
  }
}
