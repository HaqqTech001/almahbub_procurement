import {
  LlmProviderError,
  type LlmCompletionRequest,
  type LlmCompletionResult,
  type LlmProvider,
} from "./llm-provider.js";

/**
 * Google Gemini generateContent API.
 */
export class GeminiProvider implements LlmProvider {
  public readonly id = "gemini";

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
    const contents = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(system
          ? { systemInstruction: { parts: [{ text: system }] } }
          : {}),
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.2,
          maxOutputTokens: request.maxTokens ?? 2_048,
          ...(request.responseFormat === "json"
            ? { responseMimeType: "application/json" }
            : {}),
        },
      }),
    });

    const payload = (await response.json()) as {
      error?: { message?: string };
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
    };

    if (!response.ok) {
      throw new LlmProviderError(
        payload.error?.message ?? `Gemini request failed (${response.status}).`,
        { statusCode: response.status >= 500 ? 502 : 400 },
      );
    }

    const content = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!content) {
      throw new LlmProviderError("Gemini returned an empty completion.");
    }

    return {
      provider: this.id,
      model: this.model,
      content,
      usage: {
        promptTokens: payload.usageMetadata?.promptTokenCount,
        completionTokens: payload.usageMetadata?.candidatesTokenCount,
      },
    };
  }
}
