-- Correct only the known wedding campaign; preserve times and unrelated dates.
UPDATE "wedding_campaigns" SET "overlay" = jsonb_set("overlay", '{eventAt}', to_jsonb(regexp_replace("overlay"->>'eventAt', '^2026-09-(29|30)', '2026-09-26'))), "updated_at" = NOW() WHERE "id" = 'founder-wedding-september-2026' AND "overlay"->>'eventAt' ~ '^2026-09-(29|30)';
UPDATE "wedding_campaigns" SET "overlay" = jsonb_set("overlay", '{streamAt}', to_jsonb(regexp_replace("overlay"->>'streamAt', '^2026-09-(29|30)', '2026-09-26'))), "updated_at" = NOW() WHERE "id" = 'founder-wedding-september-2026' AND "overlay"->>'streamAt' ~ '^2026-09-(29|30)';
UPDATE "wedding_campaigns" SET "overlay" = jsonb_set("overlay", '{modalEndsAt}', '"2026-09-29T00:00:00.000Z"'::jsonb), "updated_at" = NOW() WHERE "id" = 'founder-wedding-september-2026' AND "overlay"->>'modalEndsAt' ~ '^2026-10-0[23]';

CREATE TABLE "wedding_subscriptions" (
 "id" UUID NOT NULL, "campaign_id" TEXT NOT NULL, "user_id" UUID NOT NULL,
 "enabled" BOOLEAN NOT NULL DEFAULT false, "subscribed_at" TIMESTAMPTZ, "unsubscribed_at" TIMESTAMPTZ,
 "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL,
 CONSTRAINT "wedding_subscriptions_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "wedding_subscriptions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "wedding_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "wedding_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "wedding_subscriptions_campaign_id_user_id_key" ON "wedding_subscriptions"("campaign_id", "user_id");
CREATE INDEX "wedding_subscriptions_campaign_id_enabled_idx" ON "wedding_subscriptions"("campaign_id", "enabled");

CREATE TABLE "wedding_waiting_memberships" (
 "id" UUID NOT NULL, "campaign_id" TEXT NOT NULL, "user_id" UUID NOT NULL,
 "joined" BOOLEAN NOT NULL DEFAULT false, "joined_at" TIMESTAMPTZ, "left_at" TIMESTAMPTZ, "last_seen_at" TIMESTAMPTZ,
 "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ NOT NULL,
 CONSTRAINT "wedding_waiting_memberships_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "wedding_waiting_memberships_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "wedding_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "wedding_waiting_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "wedding_waiting_memberships_campaign_id_user_id_key" ON "wedding_waiting_memberships"("campaign_id", "user_id");
CREATE INDEX "wedding_waiting_memberships_campaign_id_joined_last_seen_at_idx" ON "wedding_waiting_memberships"("campaign_id", "joined", "last_seen_at");
