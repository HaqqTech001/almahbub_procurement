-- Payment domain: manual finance dual control, immutable evidence/history,
-- idempotent creation, and optimistic concurrency.
CREATE TYPE "PaymentMethod" AS ENUM ('manual_bank_transfer');

ALTER TABLE "payments"
  ADD COLUMN "created_by_id" UUID,
  ADD COLUMN "confirmed_by_id" UUID,
  ADD COLUMN "idempotency_key" TEXT,
  ADD COLUMN "method" "PaymentMethod" NOT NULL DEFAULT 'manual_bank_transfer',
  ADD COLUMN "evidence" JSONB,
  ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- A historical row has no reliable creator. Inventing one would defeat the
-- dual-control guarantee, so require an explicit finance migration instead.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "payments") THEN
    RAISE EXCEPTION 'Payment domain migration requires payments to be empty; migrate historical creator identities explicitly.';
  END IF;
END $$;

UPDATE "payments" SET "idempotency_key" = "id"::TEXT WHERE "idempotency_key" IS NULL;
ALTER TABLE "payments"
  ALTER COLUMN "idempotency_key" SET NOT NULL,
  ALTER COLUMN "created_by_id" SET NOT NULL;

CREATE TABLE "payment_history" (
  "id" UUID NOT NULL,
  "payment_id" UUID NOT NULL,
  "from_status" "PaymentStatus",
  "to_status" "PaymentStatus" NOT NULL,
  "command" TEXT NOT NULL,
  "reason" TEXT,
  "actor_id" UUID NOT NULL,
  "row_version" INTEGER NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payments_organization_id_idempotency_key_key"
  ON "payments"("organization_id", "idempotency_key");
CREATE INDEX "payment_history_payment_id_created_at_idx"
  ON "payment_history"("payment_id", "created_at" DESC);
CREATE INDEX "payment_history_actor_id_created_at_idx"
  ON "payment_history"("actor_id", "created_at" DESC);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "payments_confirmed_by_id_fkey"
    FOREIGN KEY ("confirmed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_history"
  ADD CONSTRAINT "payment_history_payment_id_fkey"
    FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "payment_history_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
