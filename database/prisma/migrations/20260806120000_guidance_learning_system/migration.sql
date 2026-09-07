-- Enterprise Guidance, Onboarding & Learning System

CREATE TYPE "GuidanceMode" AS ENUM ('off', 'guided', 'training');
CREATE TYPE "GuidanceTourStatus" AS ENUM ('draft', 'published', 'archived', 'scheduled');
CREATE TYPE "GuidanceProgressStatus" AS ENUM ('not_started', 'in_progress', 'completed', 'skipped');
CREATE TYPE "GuidanceAudience" AS ENUM ('client_workspace', 'operations_console', 'supplier_portal', 'mobile', 'all_authenticated');

CREATE TABLE "guidance_tours" (
  "id" UUID NOT NULL,
  "organization_id" UUID,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "audience" "GuidanceAudience" NOT NULL DEFAULT 'all_authenticated',
  "page_key" TEXT NOT NULL,
  "status" "GuidanceTourStatus" NOT NULL DEFAULT 'draft',
  "mandatory" BOOLEAN NOT NULL DEFAULT false,
  "estimated_minutes" INTEGER NOT NULL DEFAULT 5,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "scheduled_for" TIMESTAMPTZ,
  "published_at" TIMESTAMPTZ,
  "row_version" INTEGER NOT NULL DEFAULT 0,
  "created_by_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "guidance_tours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guidance_tour_steps" (
  "id" UUID NOT NULL,
  "tour_id" UUID NOT NULL,
  "step_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "target_selector" TEXT,
  "placement" TEXT NOT NULL DEFAULT 'auto',
  "require_action" BOOLEAN NOT NULL DEFAULT false,
  "action_event" TEXT,
  "action_label" TEXT,
  "image_href" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "guidance_tour_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guidance_tips" (
  "id" UUID NOT NULL,
  "organization_id" UUID,
  "key" TEXT NOT NULL,
  "feature_key" TEXT NOT NULL,
  "page_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "target_selector" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "guidance_tips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guidance_user_preferences" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "organization_id" UUID,
  "mode" "GuidanceMode" NOT NULL DEFAULT 'guided',
  "never_auto_start" BOOLEAN NOT NULL DEFAULT false,
  "welcome_completed_at" TIMESTAMPTZ,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "updated_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guidance_user_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guidance_user_progress" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "organization_id" UUID,
  "tour_id" UUID NOT NULL,
  "status" "GuidanceProgressStatus" NOT NULL DEFAULT 'not_started',
  "current_step_key" TEXT,
  "completed_steps" INTEGER NOT NULL DEFAULT 0,
  "total_steps" INTEGER NOT NULL DEFAULT 0,
  "started_at" TIMESTAMPTZ,
  "completed_at" TIMESTAMPTZ,
  "skipped_at" TIMESTAMPTZ,
  "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "guidance_user_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guidance_tip_dismissals" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "tip_id" UUID NOT NULL,
  "dismissed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "guidance_tip_dismissals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "guidance_tours_organization_id_key_locale_key" ON "guidance_tours"("organization_id", "key", "locale");
CREATE INDEX "guidance_tours_status_audience_page_key_idx" ON "guidance_tours"("status", "audience", "page_key");
CREATE UNIQUE INDEX "guidance_tour_steps_tour_id_step_key_key" ON "guidance_tour_steps"("tour_id", "step_key");
CREATE INDEX "guidance_tour_steps_tour_id_sort_order_idx" ON "guidance_tour_steps"("tour_id", "sort_order");
CREATE UNIQUE INDEX "guidance_tips_organization_id_key_locale_key" ON "guidance_tips"("organization_id", "key", "locale");
CREATE INDEX "guidance_tips_page_key_feature_key_enabled_idx" ON "guidance_tips"("page_key", "feature_key", "enabled");
CREATE UNIQUE INDEX "guidance_user_preferences_user_id_organization_id_key" ON "guidance_user_preferences"("user_id", "organization_id");
CREATE INDEX "guidance_user_preferences_user_id_idx" ON "guidance_user_preferences"("user_id");
CREATE UNIQUE INDEX "guidance_user_progress_user_id_tour_id_key" ON "guidance_user_progress"("user_id", "tour_id");
CREATE INDEX "guidance_user_progress_user_id_status_idx" ON "guidance_user_progress"("user_id", "status");
CREATE UNIQUE INDEX "guidance_tip_dismissals_user_id_tip_id_key" ON "guidance_tip_dismissals"("user_id", "tip_id");

ALTER TABLE "guidance_tours" ADD CONSTRAINT "guidance_tours_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "guidance_tours" ADD CONSTRAINT "guidance_tours_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "guidance_tour_steps" ADD CONSTRAINT "guidance_tour_steps_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "guidance_tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guidance_tips" ADD CONSTRAINT "guidance_tips_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "guidance_user_preferences" ADD CONSTRAINT "guidance_user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guidance_user_progress" ADD CONSTRAINT "guidance_user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guidance_user_progress" ADD CONSTRAINT "guidance_user_progress_tour_id_fkey" FOREIGN KEY ("tour_id") REFERENCES "guidance_tours"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guidance_tip_dismissals" ADD CONSTRAINT "guidance_tip_dismissals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "guidance_tip_dismissals" ADD CONSTRAINT "guidance_tip_dismissals_tip_id_fkey" FOREIGN KEY ("tip_id") REFERENCES "guidance_tips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
