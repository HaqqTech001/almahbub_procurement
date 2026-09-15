import { DEFAULT_WEDDING_CAMPAIGN, WEDDING_CAMPAIGN_ID } from "@hamd/constants";
import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";

export class WeddingParticipationService {
  public constructor(private readonly database: DatabaseClient) {}

  public async state(userId: string) {
    const where = { campaignId_userId: { campaignId: WEDDING_CAMPAIGN_ID, userId } };
    const [subscription, waiting] = await Promise.all([
      this.database.weddingSubscription.findUnique({ where }),
      this.database.weddingWaitingMembership.findUnique({ where }),
    ]);
    return { subscribed: subscription?.enabled ?? false, joined: waiting?.joined ?? false };
  }

  public async change(auth: AuthContext, kind: "subscription" | "waiting", enabled: boolean) {
    if (kind === "subscription" && enabled) {
      const user = await this.database.user.findUnique({
        where: { id: auth.userId }, select: { emailVerifiedAt: true },
      });
      if (!user?.emailVerifiedAt) throw new AppError({
        statusCode: 403, code: "EMAIL_VERIFICATION_REQUIRED",
        message: "Verify your account email before subscribing to wedding updates.",
      });
    }
    await this.database.$transaction(async (tx) => {
      const campaign = await tx.weddingCampaign.findUnique({
        where: { id: WEDDING_CAMPAIGN_ID }, select: { id: true },
      });
      // Normal attendance changes lock only that member's row, not the campaign.
      if (!campaign) await tx.weddingCampaign.upsert({
        where: { id: WEDDING_CAMPAIGN_ID }, update: { slug: DEFAULT_WEDDING_CAMPAIGN.slug },
        create: { id: WEDDING_CAMPAIGN_ID, slug: DEFAULT_WEDDING_CAMPAIGN.slug,
          overlay: JSON.parse(JSON.stringify(DEFAULT_WEDDING_CAMPAIGN)) },
      });
      const identity = { campaignId: WEDDING_CAMPAIGN_ID, userId: auth.userId };
      const where = { campaignId_userId: identity };
      const now = new Date();
      let resourceId: string;
      let changed: number;
      if (kind === "subscription") {
        const row = await tx.weddingSubscription.upsert({ where, create: identity, update: { updatedAt: now } });
        resourceId = row.id;
        const result = await tx.weddingSubscription.updateMany({
          where: { ...identity, enabled: !enabled },
          data: { enabled, ...(enabled ? { subscribedAt: now } : { unsubscribedAt: now }) },
        });
        changed = result.count;
      } else {
        const row = await tx.weddingWaitingMembership.upsert({ where, create: identity, update: { updatedAt: now } });
        resourceId = row.id;
        const result = await tx.weddingWaitingMembership.updateMany({
          where: { ...identity, joined: !enabled },
          data: { joined: enabled, ...(enabled ? { joinedAt: now, lastSeenAt: now } : { leftAt: now }) },
        });
        changed = result.count;
      }
      if (changed) await tx.auditEvent.create({ data: {
        organizationId: auth.organizationId, actorId: auth.userId, resourceId,
        resourceType: `wedding_${kind}`,
        action: kind === "subscription" ? (enabled ? "wedding.subscribed" : "wedding.unsubscribed")
          : (enabled ? "wedding.waiting.joined" : "wedding.waiting.left"),
        metadata: { campaignId: WEDDING_CAMPAIGN_ID },
      } });
    });
    return this.state(auth.userId);
  }

  public async heartbeat(userId: string) {
    await this.database.weddingWaitingMembership.updateMany({
      where: { campaignId: WEDDING_CAMPAIGN_ID, userId, joined: true },
      data: { lastSeenAt: new Date() },
    });
    return this.state(userId);
  }

  public async list(kind: "subscription" | "waiting", page: number) {
    const where = { campaignId: WEDDING_CAMPAIGN_ID };
    const activeSince = new Date(Date.now() - 90_000);
    const user = { select: { id: true, displayName: true, firstName: true, lastName: true } } as const;
    const pagination = { skip: (page - 1) * 50, take: 50, orderBy: { createdAt: "desc" as const } };
    if (kind === "subscription") {
      const [rows, total, enabled] = await Promise.all([
        this.database.weddingSubscription.findMany({ where, include: { user }, ...pagination }),
        this.database.weddingSubscription.count({ where }),
        this.database.weddingSubscription.count({ where: { ...where, enabled: true } }),
      ]);
      return { page, total, enabled, active: 0, items: rows.map((row) => ({
        id: row.id, displayName: displayName(row.user), enabled: row.enabled,
        since: row.subscribedAt, endedAt: row.unsubscribedAt, active: false,
      })) };
    }
    const [rows, total, enabled, active] = await Promise.all([
      this.database.weddingWaitingMembership.findMany({ where, include: { user }, ...pagination }),
      this.database.weddingWaitingMembership.count({ where }),
      this.database.weddingWaitingMembership.count({ where: { ...where, joined: true } }),
      this.database.weddingWaitingMembership.count({ where: { ...where, joined: true, lastSeenAt: { gte: activeSince } } }),
    ]);
    return { page, total, enabled, active, items: rows.map((row) => ({
      id: row.id, displayName: displayName(row.user), enabled: row.joined,
      since: row.joinedAt, endedAt: row.leftAt,
      active: row.joined && !!row.lastSeenAt && row.lastSeenAt >= activeSince,
    })) };
  }
}

function displayName(user: { displayName: string | null; firstName: string; lastName: string }) {
  return user.displayName || `${user.firstName} ${user.lastName}`.trim() || "Wedding guest";
}
