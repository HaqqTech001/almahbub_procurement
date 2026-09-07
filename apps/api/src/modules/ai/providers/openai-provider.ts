import {
  LlmProviderError,
  type LlmCompletionRequest,
  type LlmCompletionResult,
  type LlmProvider,
} from "./llm-provider.js";

/**
 * OpenAI Chat Completions - https://api.openai.com/v1/chat/completions
 */
export class OpenAiProvider implements LlmProvider {
  public readonly id = "openai";

  public constructor(
    private readonly apiKey: string,
    public readonly model: string,
    private readonly baseUrl = "https://api.openai.com/v1",
  ) {}

  public async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResult> {
    const body: Record<string, unknown> = {
      model: this.model,
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

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
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
        payload.error?.message ?? `OpenAI request failed (${response.status}).`,
        { statusCode: response.status >= 500 ? 502 : 400 },
      );
    }

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new LlmProviderError("OpenAI returned an empty completion.");
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
