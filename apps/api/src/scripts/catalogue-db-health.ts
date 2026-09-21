import "../load-env.js";
import { createDatabaseClient } from "@hamd/database";
import { parseEnvironment } from "../config/env.js";
const env = parseEnvironment(process.env);
const host = env.DATABASE_URL ? new URL(env.DATABASE_URL).hostname : null;
console.log(
  JSON.stringify({
    databaseConfigured: Boolean(env.DATABASE_URL),
    databaseHost: host,
    storageDriver: env.CATALOG_MEDIA_DRIVER,
    supabaseConfigured: Boolean(
      env.CATALOG_MEDIA_SUPABASE_URL &&
      env.CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY,
    ),
    s3Configured: Boolean(
      env.CATALOG_MEDIA_S3_BUCKET &&
      env.AWS_REGION &&
      env.AWS_ACCESS_KEY_ID &&
      env.AWS_SECRET_ACCESS_KEY,
    ),
  }),
);
if (!env.DATABASE_URL) process.exitCode = 1;
else {
  const db = createDatabaseClient(env.DATABASE_URL);
  let stage = "connect";
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const start = Date.now();
      try {
        await db.$queryRaw`SELECT 1`;
        console.log(
          JSON.stringify({
            stage,
            attempt,
            status: "connected",
            durationMs: Date.now() - start,
          }),
        );
        break;
      } catch {
        if (attempt === 3) throw new Error("connect_failed");
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }
    for (let sample = 1; sample <= 3; sample++) {
      stage = "product.count";
      let start = Date.now();
      const count = await db.product.count();
      console.log(
        JSON.stringify({
          stage,
          sample,
          count,
          durationMs: Date.now() - start,
        }),
      );
      stage = "draft.lookup";
      start = Date.now();
      await db.product.findFirst({
        where: { slug: "electronics-smartphone-gimbal" },
        select: { id: true, status: true },
      });
      console.log(
        JSON.stringify({ stage, sample, durationMs: Date.now() - start }),
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        stage,
        status: "failed",
        code:
          typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "DB_HEALTH_FAILED",
      }),
    );
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
