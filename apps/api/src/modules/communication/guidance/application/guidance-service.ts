import type { Prisma } from "@hamd/database";

import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import type {
  CreateTourInput,
  ResetProgressInput,
  UpdatePreferenceInput,
  UpdateTourInput,
  UpsertProgressInput,
} from "../api/guidance-schemas.js";
import { assertGuidanceManage, assertGuidanceRead } from "./guidance-policy.js";

export class GuidanceService {
  public constructor(private readonly database: DatabaseClient) {}

  public async getPreference(context: AuthContext) {
    assertGuidanceRead(context);
    const existing = await this.database.guidanceUserPreference.findFirst({
      where: {
        userId: context.userId,
        OR: [{ organizationId: context.organizationId }, { organizationId: null }],
      },
      orderBy: { organizationId: "desc" },
    });
    if (existing) return serializePreference(existing);
    return {
      mode: "guided" as const,
      neverAutoStart: false,
      welcomeCompletedAt: null,
      locale: "en",
    };
  }

  public async updatePreference(
    context: AuthContext,
    input: UpdatePreferenceInput,
    requestId: string,
  ) {
    assertGuidanceRead(context);
    const updated = await this.database.$transaction(async (tx) => {
      const row = await tx.guidanceUserPreference.upsert({
        where: {
          userId_organizationId: {
            userId: context.userId,
            organizationId: context.organizationId,
          },
        },
        create: {
          userId: context.userId,
          organizationId: context.organizationId,
          mode: input.mode ?? "guided",
          neverAutoStart: input.neverAutoStart ?? false,
          locale: input.locale ?? "en",
          ...(input.welcomeCompleted
            ? { welcomeCompletedAt: new Date() }
            : {}),
        },
        update: {
          ...(input.mode !== undefined ? { mode: input.mode } : {}),
          ...(input.neverAutoStart !== undefined
            ? { neverAutoStart: input.neverAutoStart }
            : {}),
          ...(input.locale !== undefined ? { locale: input.locale } : {}),
          ...(input.welcomeCompleted
            ? { welcomeCompletedAt: new Date() }
            : {}),
        },
      });
      await audit(tx, context, "guidance.preference_updated", requestId, context.userId, {
        mode: row.mode,
      });
      return row;
    });
    return serializePreference(updated);
  }

  public async listPublishedTours(context: AuthContext) {
    assertGuidanceRead(context);
    const tours = await this.database.guidanceTour.findMany({
      where: {
        status: "published",
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
      include: { steps: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    return tours.map(serializeTour);
  }

  public async listTips(context: AuthContext) {
    assertGuidanceRead(context);
    const tips = await this.database.guidanceTip.findMany({
      where: {
        enabled: true,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { key: "asc" },
    });
    return tips.map(serializeTip);
  }

  public async listProgress(context: AuthContext) {
    assertGuidanceRead(context);
    const rows = await this.database.guidanceUserProgress.findMany({
      where: { userId: context.userId },
      include: { tour: { select: { key: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => ({
      tourId: row.tourId,
      tourKey: row.tour.key,
      status: row.status,
      currentStepKey: row.currentStepKey,
      completedSteps: row.completedSteps,
      totalSteps: row.totalSteps,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      skippedAt: row.skippedAt?.toISOString() ?? null,
      lastActiveAt: row.lastActiveAt.toISOString(),
    }));
  }

  public async upsertProgress(
    context: AuthContext,
    input: UpsertProgressInput,
    requestId: string,
  ) {
    assertGuidanceRead(context);
    const tour = await this.database.guidanceTour.findFirst({
      where: {
        id: input.tourId,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!tour) throw notFound("Tour not found.");

    const now = new Date();
    const row = await this.database.$transaction(async (tx) => {
      const saved = await tx.guidanceUserProgress.upsert({
        where: {
          userId_tourId: { userId: context.userId, tourId: input.tourId },
        },
        create: {
          userId: context.userId,
          organizationId: context.organizationId,
          tourId: input.tourId,
          status: input.status,
          currentStepKey: input.currentStepKey ?? null,
          completedSteps: input.completedSteps ?? 0,
          totalSteps: input.totalSteps ?? 0,
          startedAt: input.status === "not_started" ? null : now,
          completedAt: input.status === "completed" ? now : null,
          skippedAt: input.status === "skipped" ? now : null,
          lastActiveAt: now,
        },
        update: {
          status: input.status,
          ...(input.currentStepKey !== undefined
            ? { currentStepKey: input.currentStepKey }
            : {}),
          ...(input.completedSteps !== undefined
            ? { completedSteps: input.completedSteps }
            : {}),
          ...(input.totalSteps !== undefined ? { totalSteps: input.totalSteps } : {}),
          ...(input.status === "completed" ? { completedAt: now } : {}),
          ...(input.status === "skipped" ? { skippedAt: now } : {}),
          lastActiveAt: now,
        },
        include: { tour: { select: { key: true } } },
      });
      await audit(tx, context, "guidance.progress_upserted", requestId, input.tourId, {
        status: input.status,
      });
      return saved;
    });

    return {
      tourId: row.tourId,
      tourKey: row.tour.key,
      status: row.status,
      currentStepKey: row.currentStepKey,
      completedSteps: row.completedSteps,
      totalSteps: row.totalSteps,
      startedAt: row.startedAt?.toISOString() ?? null,
      completedAt: row.completedAt?.toISOString() ?? null,
      skippedAt: row.skippedAt?.toISOString() ?? null,
      lastActiveAt: row.lastActiveAt.toISOString(),
    };
  }

  public async dismissTip(context: AuthContext, tipId: string, requestId: string) {
    assertGuidanceRead(context);
    const tip = await this.database.guidanceTip.findFirst({
      where: {
        id: tipId,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!tip) throw notFound("Tip not found.");
    await this.database.$transaction(async (tx) => {
      await tx.guidanceTipDismissal.upsert({
        where: { userId_tipId: { userId: context.userId, tipId } },
        create: { userId: context.userId, tipId },
        update: { dismissedAt: new Date() },
      });
      await audit(tx, context, "guidance.tip_dismissed", requestId, tipId);
    });
  }

  public async listDismissedTips(context: AuthContext) {
    assertGuidanceRead(context);
    const rows = await this.database.guidanceTipDismissal.findMany({
      where: { userId: context.userId },
      select: { tipId: true },
    });
    return rows.map((r) => r.tipId);
  }

  public async resetProgress(
    context: AuthContext,
    input: ResetProgressInput,
    requestId: string,
  ) {
    const targetUserId = input.userId ?? context.userId;
    if (targetUserId !== context.userId) {
      assertGuidanceManage(context);
    } else {
      assertGuidanceRead(context);
    }

    await this.database.$transaction(async (tx) => {
      if (input.scope === "all") {
        await tx.guidanceUserProgress.deleteMany({ where: { userId: targetUserId } });
        await tx.guidanceTipDismissal.deleteMany({ where: { userId: targetUserId } });
      } else {
        if (!input.tourId) {
          throw new AppError({
            statusCode: 422,
            code: "VALIDATION_ERROR",
            message: "tourId is required when scope is current.",
          });
        }
        await tx.guidanceUserProgress.deleteMany({
          where: { userId: targetUserId, tourId: input.tourId },
        });
      }
      await audit(tx, context, "guidance.progress_reset", requestId, targetUserId, {
        scope: input.scope,
        tourId: input.tourId ?? null,
      });
    });
  }

  public async adminListTours(context: AuthContext) {
    assertGuidanceManage(context);
    const tours = await this.database.guidanceTour.findMany({
      where: {
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
      include: { steps: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });
    return tours.map(serializeTour);
  }

  public async createTour(
    context: AuthContext,
    input: CreateTourInput,
    requestId: string,
  ) {
    assertGuidanceManage(context);
    const created = await this.database.$transaction(async (tx) => {
      const tour = await tx.guidanceTour.create({
        data: {
          organizationId: context.organizationId,
          key: input.key,
          title: input.title,
          description: input.description ?? null,
          audience: input.audience,
          pageKey: input.pageKey,
          mandatory: input.mandatory ?? false,
          estimatedMinutes: input.estimatedMinutes ?? 5,
          locale: input.locale ?? "en",
          sortOrder: input.sortOrder ?? 0,
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
          status: input.scheduledFor ? "scheduled" : "draft",
          createdById: context.userId,
          steps: {
            create: input.steps.map((step, index) => ({
              stepKey: step.stepKey,
              title: step.title,
              body: step.body,
              targetSelector: step.targetSelector ?? null,
              placement: step.placement ?? "auto",
              requireAction: step.requireAction ?? false,
              actionEvent: step.actionEvent ?? null,
              actionLabel: step.actionLabel ?? null,
              imageHref: step.imageHref ?? null,
              sortOrder: step.sortOrder ?? index,
            })),
          },
        },
        include: { steps: { orderBy: { sortOrder: "asc" } } },
      });
      await audit(tx, context, "guidance.tour_created", requestId, tour.id, {
        key: tour.key,
      });
      return tour;
    });
    return serializeTour(created);
  }

  public async updateTour(
    context: AuthContext,
    tourId: string,
    input: UpdateTourInput,
    requestId: string,
  ) {
    assertGuidanceManage(context);
    const existing = await this.findOrgTour(context, tourId);
    const updated = await this.database.$transaction(async (tx) => {
      if (input.steps) {
        await tx.guidanceTourStep.deleteMany({ where: { tourId } });
        await tx.guidanceTourStep.createMany({
          data: input.steps.map((step, index) => ({
            tourId,
            stepKey: step.stepKey,
            title: step.title,
            body: step.body,
            targetSelector: step.targetSelector ?? null,
            placement: step.placement ?? "auto",
            requireAction: step.requireAction ?? false,
            actionEvent: step.actionEvent ?? null,
            actionLabel: step.actionLabel ?? null,
            imageHref: step.imageHref ?? null,
            sortOrder: step.sortOrder ?? index,
          })),
        });
      }
      const tour = await tx.guidanceTour.update({
        where: { id: tourId },
        data: {
          ...(input.key !== undefined ? { key: input.key } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.audience !== undefined ? { audience: input.audience } : {}),
          ...(input.pageKey !== undefined ? { pageKey: input.pageKey } : {}),
          ...(input.mandatory !== undefined ? { mandatory: input.mandatory } : {}),
          ...(input.estimatedMinutes !== undefined
            ? { estimatedMinutes: input.estimatedMinutes }
            : {}),
          ...(input.locale !== undefined ? { locale: input.locale } : {}),
          ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.scheduledFor !== undefined
            ? {
                scheduledFor: input.scheduledFor
                  ? new Date(input.scheduledFor)
                  : null,
              }
            : {}),
          rowVersion: { increment: 1 },
        },
        include: { steps: { orderBy: { sortOrder: "asc" } } },
      });
      await audit(tx, context, "guidance.tour_updated", requestId, tour.id, {
        fromVersion: existing.rowVersion,
      });
      return tour;
    });
    return serializeTour(updated);
  }

  public async publishTour(context: AuthContext, tourId: string, requestId: string) {
    assertGuidanceManage(context);
    await this.findOrgTour(context, tourId);
    const tour = await this.database.$transaction(async (tx) => {
      const published = await tx.guidanceTour.update({
        where: { id: tourId },
        data: {
          status: "published",
          publishedAt: new Date(),
          rowVersion: { increment: 1 },
        },
        include: { steps: { orderBy: { sortOrder: "asc" } } },
      });
      await audit(tx, context, "guidance.tour_published", requestId, tourId);
      return published;
    });
    return serializeTour(tour);
  }

  public async unpublishTour(context: AuthContext, tourId: string, requestId: string) {
    assertGuidanceManage(context);
    await this.findOrgTour(context, tourId);
    const tour = await this.database.$transaction(async (tx) => {
      const archived = await tx.guidanceTour.update({
        where: { id: tourId },
        data: {
          status: "archived",
          rowVersion: { increment: 1 },
        },
        include: { steps: { orderBy: { sortOrder: "asc" } } },
      });
      await audit(tx, context, "guidance.tour_unpublished", requestId, tourId);
      return archived;
    });
    return serializeTour(tour);
  }

  public async scheduleTour(
    context: AuthContext,
    tourId: string,
    scheduledFor: string,
    requestId: string,
  ) {
    assertGuidanceManage(context);
    await this.findOrgTour(context, tourId);
    const tour = await this.database.$transaction(async (tx) => {
      const scheduled = await tx.guidanceTour.update({
        where: { id: tourId },
        data: {
          status: "scheduled",
          scheduledFor: new Date(scheduledFor),
          rowVersion: { increment: 1 },
        },
        include: { steps: { orderBy: { sortOrder: "asc" } } },
      });
      await audit(tx, context, "guidance.tour_scheduled", requestId, tourId, {
        scheduledFor,
      });
      return scheduled;
    });
    return serializeTour(tour);
  }

  public async analytics(context: AuthContext) {
    assertGuidanceManage(context);
    const [prefs, progress] = await Promise.all([
      this.database.guidanceUserPreference.findMany({
        where: { organizationId: context.organizationId },
        select: { mode: true, welcomeCompletedAt: true },
      }),
      this.database.guidanceUserProgress.findMany({
        where: { organizationId: context.organizationId },
        select: { status: true },
      }),
    ]);
    const modeBreakdown = { off: 0, guided: 0, training: 0 };
    for (const pref of prefs) {
      modeBreakdown[pref.mode] += 1;
    }
    const toursCompleted = progress.filter((p) => p.status === "completed").length;
    const toursSkipped = progress.filter((p) => p.status === "skipped").length;
    const totalUsers = prefs.length;
    const welcomeCompleted = prefs.filter((p) => p.welcomeCompletedAt).length;
    const completionRate =
      progress.length === 0
        ? 0
        : Math.round((toursCompleted / progress.length) * 100);
    return {
      totalUsers,
      welcomeCompleted,
      toursCompleted,
      toursSkipped,
      modeBreakdown,
      completionRate,
    };
  }

  private async findOrgTour(context: AuthContext, tourId: string) {
    const tour = await this.database.guidanceTour.findFirst({
      where: {
        id: tourId,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!tour) throw notFound("Tour not found.");
    return tour;
  }
}

function serializePreference(row: {
  mode: "off" | "guided" | "training";
  neverAutoStart: boolean;
  welcomeCompletedAt: Date | null;
  locale: string;
}) {
  return {
    mode: row.mode,
    neverAutoStart: row.neverAutoStart,
    welcomeCompletedAt: row.welcomeCompletedAt?.toISOString() ?? null,
    locale: row.locale,
  };
}

function serializeTour(tour: {
  id: string;
  key: string;
  title: string;
  description: string | null;
  audience: string;
  pageKey: string;
  status: string;
  mandatory: boolean;
  estimatedMinutes: number;
  locale: string;
  sortOrder: number;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  steps: Array<{
    id: string;
    stepKey: string;
    title: string;
    body: string;
    targetSelector: string | null;
    placement: string;
    requireAction: boolean;
    actionEvent: string | null;
    actionLabel: string | null;
    imageHref: string | null;
    sortOrder: number;
  }>;
}) {
  return {
    id: tour.id,
    key: tour.key,
    title: tour.title,
    description: tour.description ?? undefined,
    audience: tour.audience,
    pageKey: tour.pageKey,
    status: tour.status,
    mandatory: tour.mandatory,
    estimatedMinutes: tour.estimatedMinutes,
    locale: tour.locale,
    sortOrder: tour.sortOrder,
    scheduledFor: tour.scheduledFor?.toISOString() ?? null,
    publishedAt: tour.publishedAt?.toISOString() ?? null,
    steps: tour.steps.map((step) => ({
      id: step.id,
      stepKey: step.stepKey,
      title: step.title,
      body: step.body,
      targetSelector: step.targetSelector ?? undefined,
      placement: step.placement,
      requireAction: step.requireAction,
      actionEvent: step.actionEvent ?? undefined,
      actionLabel: step.actionLabel ?? undefined,
      imageHref: step.imageHref ?? undefined,
      sortOrder: step.sortOrder,
    })),
  };
}

function serializeTip(tip: {
  id: string;
  key: string;
  featureKey: string;
  pageKey: string;
  title: string;
  body: string;
  targetSelector: string | null;
  locale: string;
  enabled: boolean;
}) {
  return {
    id: tip.id,
    key: tip.key,
    featureKey: tip.featureKey,
    pageKey: tip.pageKey,
    title: tip.title,
    body: tip.body,
    targetSelector: tip.targetSelector ?? undefined,
    locale: tip.locale,
    enabled: tip.enabled,
  };
}

function notFound(message: string): AppError {
  return new AppError({ statusCode: 404, code: "NOT_FOUND", message });
}

async function audit(
  transaction: Prisma.TransactionClient,
  context: AuthContext,
  action: string,
  requestId: string,
  resourceId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await transaction.auditEvent.create({
    data: {
      organizationId: context.organizationId,
      actorId: context.userId,
      action,
      resourceType: "guidance",
      resourceId,
      requestId,
      ...(Object.keys(metadata).length
        ? { metadata: metadata as Prisma.InputJsonValue }
        : {}),
    },
  });
}
