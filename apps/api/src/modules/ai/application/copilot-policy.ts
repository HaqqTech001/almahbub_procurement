import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";

const AI_USE_PERMISSIONS = [
  "ai:use",
  "ops:access",
  "request:read",
  "quotation:read",
  "shipment:read",
] as const;

export function assertAuthenticated(
  context: AuthContext | undefined,
): AuthContext {
  if (!context) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required.",
    });
  }
  return context;
}

export function assertAiUse(context: AuthContext): void {
  const allowed = AI_USE_PERMISSIONS.some((key) =>
    context.permissionKeys.has(key),
  );
  if (!allowed) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to use the AI procurement copilot.",
    });
  }
}

export function requireConfiguredProvider<T>(provider: T | null): T {
  if (!provider) {
    throw new AppError({
      statusCode: 503,
      code: "AI_NOT_CONFIGURED",
      message:
        "No LLM provider is configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, or Azure OpenAI credentials.",
    });
  }
  return provider;
}
