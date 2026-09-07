/**
 * Apply announcement pin/schedule columns and related tables when Prisma
 * migrate cannot reach the pooler but the API already can. Idempotent.
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createDatabaseClient } from "../index.js";

const here = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(here, "../.env") });
loadEnv({ path: resolve(here, "../../apps/api/.env"), override: true });

const statements = [
  `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "pinned" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "scheduled_for" TIMESTAMPTZ`,
  `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMPTZ`,
  `ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0`,
  `CREATE INDEX IF NOT EXISTS "announcements_pinned_published_at_idx" ON "announcements" ("pinned", "published_at" DESC)`,
  `CREATE TABLE IF NOT EXISTS "announcement_media" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcement_media_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "announcement_media_announcement_id_document_id_key" ON "announcement_media"("announcement_id", "document_id")`,
  `CREATE INDEX IF NOT EXISTS "announcement_media_document_id_idx" ON "announcement_media"("document_id")`,
  `CREATE INDEX IF NOT EXISTS "announcement_media_announcement_id_sort_order_idx" ON "announcement_media"("announcement_id", "sort_order")`,
  `DO $$ BEGIN
    ALTER TABLE "announcement_media"
      ADD CONSTRAINT "announcement_media_announcement_id_fkey"
      FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "announcement_media"
      ADD CONSTRAINT "announcement_media_document_id_fkey"
      FOREIGN KEY ("document_id") REFERENCES "stored_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `CREATE TABLE IF NOT EXISTS "announcement_replies" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "hidden_at" TIMESTAMPTZ,
    "hidden_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "announcement_replies_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "announcement_replies_announcement_id_created_at_idx" ON "announcement_replies"("announcement_id", "created_at")`,
  `CREATE INDEX IF NOT EXISTS "announcement_replies_author_user_id_idx" ON "announcement_replies"("author_user_id")`,
  `DO $$ BEGIN
    ALTER TABLE "announcement_replies"
      ADD CONSTRAINT "announcement_replies_announcement_id_fkey"
      FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "announcement_replies"
      ADD CONSTRAINT "announcement_replies_author_user_id_fkey"
      FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
  `DO $$ BEGIN
    ALTER TABLE "announcement_replies"
      ADD CONSTRAINT "announcement_replies_hidden_by_user_id_fkey"
      FOREIGN KEY ("hidden_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END $$`,
];

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");

  const database = createDatabaseClient(url);
  try {
    const before = await database.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'announcements'
        AND column_name IN ('pinned', 'scheduled_for', 'expires_at', 'view_count')
      ORDER BY 1
    `;
    console.info(
      "announcements columns before:",
      before.map((row) => row.column_name),
    );

    for (const sql of statements) {
      await database.$executeRawUnsafe(sql);
    }

    const after = await database.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'announcements'
        AND column_name IN ('pinned', 'scheduled_for', 'expires_at', 'view_count')
      ORDER BY 1
    `;
    console.info(
      "announcements columns after:",
      after.map((row) => row.column_name),
    );

    const tables = await database.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('announcement_media', 'announcement_replies')
      ORDER BY 1
    `;
    console.info(
      "announcement related tables:",
      tables.map((row) => row.table_name),
    );
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
