import {
  LlmProviderError,
  type LlmCompletionRequest,
  type LlmCompletionResult,
  type LlmProvider,
} from "./llm-provider.js";

/**
 * Azure OpenAI Chat Completions (deployment-scoped).
 */
export class AzureOpenAiProvider implements LlmProvider {
  public readonly id = "azure_openai";

  public constructor(
    private readonly apiKey: string,
    private readonly endpoint: string,
    public readonly model: string,
    private readonly apiVersion = "2024-10-21",
  ) {}

  public async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResult> {
    const base = this.endpoint.replace(/\/$/, "");
    const url = `${base}/openai/deployments/${encodeURIComponent(this.model)}/chat/completions?api-version=${encodeURIComponent(this.apiVersion)}`;

    const body: Record<string, unknown> = {
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens ?? 2_048,
    };
    if (request.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
      model?: string;
    };

    if (!response.ok) {
      throw new LlmProviderError(
        payload.error?.message ??
          `Azure OpenAI request failed (${response.status}).`,
        { statusCode: response.status >= 500 ? 502 : 400 },
      );
    }

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new LlmProviderError("Azure OpenAI returned an empty completion.");
    }

    return {
      provider: this.id,
      model: payload.model ?? this.model,
      content,
      usage: {
        promptTokens: payload.usage?.prompt_tokens,
        completionTokens: payload.usage?.completion_tokens,
      },
    };
  }
}
