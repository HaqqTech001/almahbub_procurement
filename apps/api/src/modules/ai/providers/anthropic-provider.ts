import {
  LlmProviderError,
  type LlmCompletionRequest,
  type LlmCompletionResult,
  type LlmProvider,
} from "./llm-provider.js";

/**
 * Anthropic Messages API - https://api.anthropic.com/v1/messages
 */
export class AnthropicProvider implements LlmProvider {
  public readonly id = "anthropic";

  public constructor(
    private readonly apiKey: string,
    public readonly model: string,
  ) {}

  public async complete(
    request: LlmCompletionRequest,
  ): Promise<LlmCompletionResult> {
    const system = request.messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const messages = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "assistant" : "user",
        content: message.content,
      }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: request.maxTokens ?? 2_048,
        temperature: request.temperature ?? 0.2,
        ...(system ? { system } : {}),
        messages,
      }),
    });

    const payload = (await response.json()) as {
      error?: { message?: string };
      content?: Array<{ type?: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };

    if (!response.ok) {
      throw new LlmProviderError(
        payload.error?.message ??
          `Anthropic request failed (${response.status}).`,
        { statusCode: response.status >= 500 ? 502 : 400 },
      );
    }

    const content = payload.content
      ?.filter((block) => block.type === "text" && block.text)
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!content) {
      throw new LlmProviderError("Anthropic returned an empty completion.");
    }

    return {
      provider: this.id,
      model: payload.model ?? this.model,
      content,
      usage: {
        promptTokens: payload.usage?.input_tokens,
        completionTokens: payload.usage?.output_tokens,
      },
    };
  }
}
