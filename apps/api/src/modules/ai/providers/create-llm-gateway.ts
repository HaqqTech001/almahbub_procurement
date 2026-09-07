import type { Environment } from "../../../config/env.js";
import { AnthropicProvider } from "./anthropic-provider.js";
import { AzureOpenAiProvider } from "./azure-openai-provider.js";
import { GeminiProvider } from "./gemini-provider.js";
import {
  type LlmProvider,
  type LlmProviderId,
} from "./llm-provider.js";
import { OpenAiProvider } from "./openai-provider.js";

export type LlmGatewayConfig = {
  readonly defaultProvider: LlmProviderId | "none";
  readonly openaiApiKey?: string | undefined;
  readonly openaiModel: string;
  readonly anthropicApiKey?: string | undefined;
  readonly anthropicModel: string;
  readonly geminiApiKey?: string | undefined;
  readonly geminiModel: string;
  readonly azureOpenAiApiKey?: string | undefined;
  readonly azureOpenAiEndpoint?: string | undefined;
  readonly azureOpenAiDeployment?: string | undefined;
};

/**
 * Builds the active LLM provider from environment. Returns null when AI is off.
 * Never returns a mock/fake completion provider.
 */
export function createLlmProviderFromEnv(
  environment: Environment,
): LlmProvider | null {
  return createLlmProvider({
    defaultProvider: environment.AI_DEFAULT_PROVIDER,
    openaiApiKey: environment.OPENAI_API_KEY,
    openaiModel: environment.AI_OPENAI_MODEL,
    anthropicApiKey: environment.ANTHROPIC_API_KEY,
    anthropicModel: environment.AI_ANTHROPIC_MODEL,
    geminiApiKey: environment.GEMINI_API_KEY,
    geminiModel: environment.AI_GEMINI_MODEL,
    azureOpenAiApiKey: environment.AZURE_OPENAI_API_KEY,
    azureOpenAiEndpoint: environment.AZURE_OPENAI_ENDPOINT,
    azureOpenAiDeployment: environment.AZURE_OPENAI_DEPLOYMENT,
  });
}

export function createLlmProvider(config: LlmGatewayConfig): LlmProvider | null {
  const preferred = config.defaultProvider;
  if (preferred === "none") {
    return firstAvailable(config);
  }

  const selected = buildProvider(preferred, config);
  if (selected) return selected;

  // Prefer explicit provider when configured; otherwise stay offline (no mock).
  return null;
}

function firstAvailable(config: LlmGatewayConfig): LlmProvider | null {
  for (const id of [
    "openai",
    "anthropic",
    "gemini",
    "azure_openai",
  ] as const) {
    const provider = buildProvider(id, config);
    if (provider) return provider;
  }
  return null;
}

function buildProvider(
  id: LlmProviderId,
  config: LlmGatewayConfig,
): LlmProvider | null {
  switch (id) {
    case "openai":
      if (!config.openaiApiKey) return null;
      return new OpenAiProvider(config.openaiApiKey, config.openaiModel);
    case "anthropic":
      if (!config.anthropicApiKey) return null;
      return new AnthropicProvider(
        config.anthropicApiKey,
        config.anthropicModel,
      );
    case "gemini":
      if (!config.geminiApiKey) return null;
      return new GeminiProvider(config.geminiApiKey, config.geminiModel);
    case "azure_openai": {
      if (
        !config.azureOpenAiApiKey ||
        !config.azureOpenAiEndpoint ||
        !config.azureOpenAiDeployment
      ) {
        return null;
      }
      return new AzureOpenAiProvider(
        config.azureOpenAiApiKey,
        config.azureOpenAiEndpoint,
        config.azureOpenAiDeployment,
      );
    }
    default:
      return null;
  }
}
