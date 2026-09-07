-- Keep the deployed identity foundation aligned with the session-security
-- fields already required by the Prisma schema. This is expand-only so older
-- API versions remain compatible during rollout.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "user_sessions"
  ADD COLUMN IF NOT EXISTS "family_id" UUID,
  ADD COLUMN IF NOT EXISTS "replaced_by_session_id" UUID,
  ADD COLUMN IF NOT EXISTS "auth_method" TEXT NOT NULL DEFAULT 'password',
  ADD COLUMN IF NOT EXISTS "mfa_verified_at" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "step_up_until" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "remember_device" BOOLEAN NOT NULL DEFAULT false;

-- Existing sessions predate refresh-token family tracking. Each becomes the
-- root of its own family before the column is made mandatory.
UPDATE "user_sessions"
SET "family_id" = "id"
WHERE "family_id" IS NULL;

ALTER TABLE "user_sessions"
  ALTER COLUMN "family_id" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_replaced_by_session_id_key"
  ON "user_sessions"("replaced_by_session_id");

CREATE INDEX IF NOT EXISTS "user_sessions_family_id_status_idx"
  ON "user_sessions"("family_id", "status");

ALTER TABLE "user_sessions"
  ADD CONSTRAINT "user_sessions_replaced_by_session_id_fkey"
  FOREIGN KEY ("replaced_by_session_id")
  REFERENCES "user_sessions"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
