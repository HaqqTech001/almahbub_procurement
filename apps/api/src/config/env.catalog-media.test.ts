import { describe, expect, it } from "vitest";

import { parseEnvironment } from "./env.js";

const productionBase = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://hamd:hamd@127.0.0.1:5432/hamd",
  REDIS_URL: "redis://127.0.0.1:6379",
  JWT_ACCESS_SECRET: "unique-high-entropy-production-secret-abcdef123456",
  RESEND_API_KEY: "re_live_example",
  EMAIL_FROM: "ops@example.com",
  CORS_ORIGINS: "https://almahbubinternational.com",
} as const;

describe("production catalog media environment", () => {
  it("rejects local catalog media in production", () => {
    expect(() =>
      parseEnvironment({
        ...productionBase,
        CATALOG_MEDIA_DRIVER: "local",
      }),
    ).toThrow(/CATALOG_MEDIA_DRIVER/);
  });

  it("requires s3 credentials when that driver is selected", () => {
    expect(() =>
      parseEnvironment({
        ...productionBase,
        CATALOG_MEDIA_DRIVER: "s3",
      }),
    ).toThrow(/CATALOG_MEDIA_S3_BUCKET|AWS_REGION|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY/);
  });

  it("requires supabase credentials when that driver is selected", () => {
    expect(() =>
      parseEnvironment({
        ...productionBase,
        CATALOG_MEDIA_DRIVER: "supabase",
      }),
    ).toThrow(/CATALOG_MEDIA_SUPABASE_URL|CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY/);
  });
});
