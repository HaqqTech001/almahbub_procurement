import { parseEnvironment as parseSharedEnvironment } from "@hamd/env";
import { splitCommaSeparated } from "@hamd/utils";
import { z } from "zod";

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    API_HOST: z.string().ip().default("127.0.0.1"),
    API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    CORS_ORIGINS: z
      .string()
      .default(
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173",
      )
      .transform(splitCommaSeparated),
    /** Express trust proxy hops (1 behind a single reverse proxy). */
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
    /** Override Secure cookie flag; defaults to true in production. */
    COOKIE_SECURE: z
      .enum(["true", "false"])
      .optional()
      .transform((value) =>
        value === undefined ? undefined : value === "true",
      ),
    DATABASE_URL: z.string().url().optional(),
    REDIS_URL: z.string().url().optional(),
    JWT_ACCESS_SECRET: z.string().min(32).optional(),
    JWT_ISSUER: z.string().default("hamd-api"),
    JWT_AUDIENCE: z.string().default("hamd-client"),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(3_600)
      .default(900),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(3_600)
      .max(7_776_000)
      .default(2_592_000),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().email().optional(),
    /** Public web origin for auth email links (verify / reset). */
    APP_PUBLIC_URL: z.string().url().optional(),
    /** Failed logins within window before ACCOUNT_LOCKED. */
    AUTH_LOCKOUT_THRESHOLD: z.coerce.number().int().min(3).max(20).default(5),
    AUTH_LOCKOUT_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(86_400)
      .default(900),
    /** AI Procurement Copilot — provider selection (none = first available key). */
    AI_DEFAULT_PROVIDER: z
      .enum(["none", "openai", "anthropic", "gemini", "azure_openai"])
      .default("none"),
    OPENAI_API_KEY: z.string().min(1).optional(),
    AI_OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    AI_ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-4-20250514"),
    GEMINI_API_KEY: z.string().min(1).optional(),
    AI_GEMINI_MODEL: z.string().min(1).default("gemini-2.0-flash"),
    AZURE_OPENAI_API_KEY: z.string().min(1).optional(),
    AZURE_OPENAI_ENDPOINT: z.string().url().optional(),
    AZURE_OPENAI_DEPLOYMENT: z.string().min(1).optional(),
    /** Local disk root for procurement/request attachments (V1 parity). */
    UPLOAD_ROOT: z.string().min(1).default("uploads"),
  })
  .superRefine((environment, context) => {
    if (environment.NODE_ENV !== "production") {
      return;
    }

    for (const key of [
      "DATABASE_URL",
      "REDIS_URL",
      "JWT_ACCESS_SECRET",
      "RESEND_API_KEY",
      "EMAIL_FROM",
    ] as const) {
      if (!environment[key]) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required in production.`,
        });
      }
    }

    if (
      environment.AI_DEFAULT_PROVIDER !== "none" &&
      environment.AI_DEFAULT_PROVIDER === "openai" &&
      !environment.OPENAI_API_KEY
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["OPENAI_API_KEY"],
        message: "OPENAI_API_KEY is required when AI_DEFAULT_PROVIDER=openai.",
      });
    }
    if (
      environment.AI_DEFAULT_PROVIDER === "anthropic" &&
      !environment.ANTHROPIC_API_KEY
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ANTHROPIC_API_KEY"],
        message:
          "ANTHROPIC_API_KEY is required when AI_DEFAULT_PROVIDER=anthropic.",
      });
    }
    if (
      environment.AI_DEFAULT_PROVIDER === "gemini" &&
      !environment.GEMINI_API_KEY
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GEMINI_API_KEY"],
        message: "GEMINI_API_KEY is required when AI_DEFAULT_PROVIDER=gemini.",
      });
    }
    if (environment.AI_DEFAULT_PROVIDER === "azure_openai") {
      for (const key of [
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_DEPLOYMENT",
      ] as const) {
        if (!environment[key]) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when AI_DEFAULT_PROVIDER=azure_openai.`,
          });
        }
      }
    }

    if (environment.CORS_ORIGINS.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGINS"],
        message: "CORS_ORIGINS must contain at least one origin in production.",
      });
    }

    const jwtSecret = environment.JWT_ACCESS_SECRET ?? "";
    const blockedSecrets = [
      "replace-with-a-unique-32-character-minimum-secret",
      "test-secret-that-is-at-least-32-characters-long",
      "change-me",
      "changeme",
    ];
    if (
      blockedSecrets.some((blocked) => jwtSecret.toLowerCase().includes(blocked)) ||
      new Set(jwtSecret).size < 16
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_ACCESS_SECRET"],
        message:
          "JWT_ACCESS_SECRET must be a unique high-entropy secret in production (not an example placeholder).",
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function parseEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): Environment {
  return parseSharedEnvironment(environmentSchema, source);
}
