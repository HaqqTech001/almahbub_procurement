import type { StoredDocument } from "@hamd/database";

import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import {
  announcementReactionDelegate,
  announcementReplyDelegate,
  type DatabaseClient,
} from "../../../../shared/database/database-client.js";
import { announcementUploadPolicy } from "../../../../shared/uploads/upload-policy.js";
import type {
  DocumentService,
  UploadedFileInput,
} from "../../../media/document/application/document-service.js";
import type {
  AutoRespondInput,
  CreateAnnouncementInput,
  CreateKnowledgeArticleInput,
  CreatePlatformServiceInput,
  MarketingContactInput,
  SupportMessageInput,
  UpdateAnnouncementInput,
  UpdateKnowledgeArticleInput,
  UpdatePlatformServiceInput,
} from "../api/parity-schemas.js";
import {
  isLivePublishedAnnouncement,
  publishedAnnouncementWhere,
} from "./announcement-visibility.js";
import { assertAuthenticated, assertParityManage } from "./parity-policy.js";

const ANNOUNCEMENT_MEDIA_INCLUDE = {
  media: {
    orderBy: { sortOrder: "asc" as const },
    include: { document: true },
  },
} as const;

function notFound(message: string): AppError {
  return new AppError({ statusCode: 404, code: "NOT_FOUND", message });
}

function mediaKind(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType === "text/plain") return "document";
  return "file";
}

function serializeAnnouncementMedia(
  announcementId: string,
  row: {
    id: string;
    sortOrder: number;
    document: StoredDocument | null;
  },
) {
  if (!row.document || row.document.deletedAt) return null;
  return {
    id: row.id,
    documentId: row.document.id,
    name: row.document.originalFilename,
    mimeType: row.document.mimeType,
    sizeBytes: row.document.sizeBytes,
    kind: mediaKind(row.document.mimeType),
    href: `/api/v1/announcements/${announcementId}/media/${row.id}`,
    sortOrder: row.sortOrder,
  };
}

function authorLabel(user: {
  firstName: string;
  lastName: string;
  displayName: string | null;
}): string {
  const display = user.displayName?.trim();
  if (display) return display;
  const last = user.lastName.trim();
  const initial = last ? `${last.slice(0, 1)}.` : "";
  return [user.firstName.trim(), initial].filter(Boolean).join(" ") || "Buyer";
}

function stripReplyHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function serializeReply(
  row: {
    id: string;
    body: string;
    createdAt: Date;
    hiddenAt: Date | null;
    author: { firstName: string; lastName: string; displayName: string | null };
  },
  options: { includeHidden?: boolean } = {},
) {
  return {
    id: row.id,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    authorLabel: authorLabel(row.author),
    hidden: Boolean(row.hiddenAt),
    ...(options.includeHidden ? { hiddenAt: row.hiddenAt?.toISOString() ?? null } : {}),
  };
}

function serializeAnnouncement(row: {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string;
  status: string;
  publishedAt: Date | null;
  pinned?: boolean;
  scheduledFor?: Date | null;
  expiresAt?: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  media?: Array<{
    id: string;
    sortOrder: number;
    document: StoredDocument | null;
  }>;
}) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? undefined,
    body: row.body,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    pinned: row.pinned ?? false,
    scheduledFor: row.scheduledFor?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    viewCount: row.viewCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    media: (row.media ?? [])
      .map((item) => serializeAnnouncementMedia(row.id, item))
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
}

function serializeMessage(row: {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  fromOps: boolean;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    threadId: row.threadId,
    authorId: row.authorId,
    body: row.body,
    fromOps: row.fromOps,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function serializeKnowledge(row: {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  active: boolean;
  hitCount: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    keywords: row.keywords,
    active: row.active,
    hitCount: row.hitCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeService(row: {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  body: string | null;
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    summary: row.summary ?? undefined,
    body: row.body ?? undefined,
    status: row.status,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const FEATURED_CATALOG_PRODUCTS = [
  {
    id: "industrial-components",
    slug: "industrial-components",
    name: "Industrial components",
    href: "/product/industrial-components",
    manufacturer: "Multi-source industrial supply",
    country: "Multi-corridor sourcing",
    moq: "MOQ confirmed per RFQ",
    leadTime: "Lead time confirmed on record",
    availability: "available_to_source",
    imageSrc: "/media/product-industrial.svg",
    imageAlt: "Industrial components",
    description:
      "Spec-driven industrial parts with MOQ and lead-time context confirmed on the record.",
    categoryName: "Industrial",
    requestHref: "/contact?product=industrial-components",
    priceLabel: "Quote on request",
  },
  {
    id: "electrical-equipment",
    slug: "electrical-equipment",
    name: "Electrical equipment",
    href: "/product/electrical-equipment",
    manufacturer: "Certified equipment corridors",
    country: "Certified supply corridors",
    moq: "Project and plant quantities",
    leadTime: "Indicative until quoted",
    availability: "available_to_source",
    imageSrc: "/media/product-electrical.svg",
    imageAlt: "Electrical equipment",
    description:
      "Certified equipment corridors for project and plant buyers - quotation-led commercial terms.",
    categoryName: "Electrical",
    requestHref: "/contact?product=electrical-equipment",
    priceLabel: "Quote on request",
  },
  {
    id: "custom-requirement",
    slug: "custom-requirement",
    name: "Custom requirement",
    href: "/product/custom-requirement",
    manufacturer: "Specification-led sourcing",
    country: "Specify destination & constraints",
    moq: "Defined with your brief",
    leadTime: "Scoped after clarification",
    availability: "unknown",
    imageSrc: "/media/product-custom.svg",
    imageAlt: "Custom requirement",
    description:
      "Specification-led sourcing when your brief does not map to a standard category.",
    categoryName: "Custom",
    requestHref: "/contact?product=custom-requirement",
    priceLabel: "Quote on request",
  },
] as const;

/**
 * RC7 V1 parity - announcements, support chat, knowledge AI, marketing, services.
 */
export class ParityService {
  public constructor(
    private readonly database: DatabaseClient,
    private readonly documents?: DocumentService,
  ) {}

  /** Public marketing featured catalog (content-backed until CMS product store ships). */
  public featuredCatalog(limit = 6) {
    const products = FEATURED_CATALOG_PRODUCTS.slice(0, limit);
    const categories = Array.from(
      new Map(
        products.map((item) => [
          item.categoryName,
          {
            id: item.categoryName.toLowerCase().replace(/\s+/g, "-"),
            name: item.categoryName,
            href: `/products?category=${encodeURIComponent(item.categoryName)}`,
          },
        ]),
      ).values(),
    );
    return { products, categories };
  }

  public async listPublishedAnnouncements() {
    const now = new Date();
    const rows = await this.database.announcement.findMany({
      where: publishedAnnouncementWhere(now),
      orderBy: [
        { pinned: "desc" },
        { publishedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: ANNOUNCEMENT_MEDIA_INCLUDE,
    });
    return rows.map(serializeAnnouncement);
  }

  public async listAnnouncementsAdmin(context: AuthContext) {
    assertParityManage(context);
    const rows = await this.database.announcement.findMany({
      where: {
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: [
        { pinned: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      include: ANNOUNCEMENT_MEDIA_INCLUDE,
    });
    return rows.map(serializeAnnouncement);
  }

  public async getAnnouncement(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );
    const existing = await this.database.announcement.findFirst({
      where: isUuid
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
      include: ANNOUNCEMENT_MEDIA_INCLUDE,
    });
    if (!existing || !isLivePublishedAnnouncement(existing)) {
      throw notFound("Announcement not found.");
    }
    const updated = await this.database.announcement.update({
      where: { id: existing.id },
      data: { viewCount: { increment: 1 } },
      include: ANNOUNCEMENT_MEDIA_INCLUDE,
    });
    return serializeAnnouncement(updated);
  }

  public async listAnnouncementReplies(
    idOrSlug: string,
    query: { cursor?: string; limit?: number; includeHidden?: boolean } = {},
  ) {
    const announcement = await this.database.announcement.findFirst({
      where: /^[0-9a-f-]{36}$/i.test(idOrSlug)
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
      select: { id: true, status: true, publishedAt: true, expiresAt: true },
    });
    if (!announcement || !isLivePublishedAnnouncement(announcement)) {
      throw notFound("Announcement not found.");
    }
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const rows = await announcementReplyDelegate(this.database).findMany({
      where: {
        announcementId: announcement.id,
        ...(query.includeHidden ? {} : { hiddenAt: null }),
        ...(query.cursor ? { createdAt: { lt: new Date(query.cursor) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      include: {
        author: { select: { firstName: true, lastName: true, displayName: true } },
      },
    });
    const extra = rows.slice(0, limit);
    const next = rows[limit];
    return {
      items: extra.map((row) =>
        serializeReply(row, query.includeHidden ? { includeHidden: true } : {}),
      ),
      nextCursor: next ? extra[extra.length - 1]?.createdAt.toISOString() ?? null : null,
    };
  }

  public async createAnnouncementReply(
    context: AuthContext,
    idOrSlug: string,
    body: string,
  ) {
    const auth = assertAuthenticated(context);
    const text = stripReplyHtml(body);
    if (text.length < 1 || text.length > 2000) {
      throw new AppError({
        statusCode: 422,
        code: "VALIDATION_ERROR",
        message: "Reply must be between 1 and 2000 characters of plain text.",
      });
    }
    const announcement = await this.database.announcement.findFirst({
      where: /^[0-9a-f-]{36}$/i.test(idOrSlug)
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
    });
    if (!announcement || !isLivePublishedAnnouncement(announcement)) {
      throw notFound("Announcement not found.");
    }
    const row = await announcementReplyDelegate(this.database).create({
      data: {
        announcementId: announcement.id,
        authorUserId: auth.userId,
        body: text,
      },
      include: {
        author: { select: { firstName: true, lastName: true, displayName: true } },
      },
    });
    return serializeReply(row);
  }

  public async listAnnouncementReactions(
    idOrSlug: string,
    viewerUserId?: string,
  ) {
    const announcement = await this.database.announcement.findFirst({
      where: /^[0-9a-f-]{36}$/i.test(idOrSlug)
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
    });
    if (!announcement || !isLivePublishedAnnouncement(announcement)) {
      throw notFound("Announcement not found.");
    }
    const rows = await announcementReactionDelegate(this.database).findMany({
      where: { announcementId: announcement.id },
    });
    const counts = new Map<string, { emoji: string; count: number; reacted: boolean }>();
    for (const row of rows) {
      const current = counts.get(row.emoji) ?? {
        emoji: row.emoji,
        count: 0,
        reacted: false,
      };
      current.count += 1;
      if (viewerUserId && row.userId === viewerUserId) current.reacted = true;
      counts.set(row.emoji, current);
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
  }

  public async toggleAnnouncementReaction(
    context: AuthContext,
    idOrSlug: string,
    emoji: string,
  ) {
    const auth = assertAuthenticated(context);
    const token = emoji.replace(/<[^>]*>/g, "").trim();
    if (token.length < 1 || token.length > 16) {
      throw new AppError({
        statusCode: 422,
        code: "VALIDATION_ERROR",
        message: "Choose a reaction character.",
      });
    }
    const announcement = await this.database.announcement.findFirst({
      where: /^[0-9a-f-]{36}$/i.test(idOrSlug)
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
    });
    if (!announcement || !isLivePublishedAnnouncement(announcement)) {
      throw notFound("Announcement not found.");
    }
    const existing = await announcementReactionDelegate(this.database).findUnique({
      where: {
        announcementId_userId_emoji: {
          announcementId: announcement.id,
          userId: auth.userId,
          emoji: token,
        },
      },
    });
    if (existing) {
      await announcementReactionDelegate(this.database).delete({
        where: { id: existing.id },
      });
    } else {
      await announcementReactionDelegate(this.database).create({
        data: {
          announcementId: announcement.id,
          userId: auth.userId,
          emoji: token,
        },
      });
    }
    return this.listAnnouncementReactions(announcement.id, auth.userId);
  }

  public async moderateAnnouncementReply(
    context: AuthContext,
    replyId: string,
    hidden: boolean,
  ) {
    assertParityManage(context);
    const existing = await announcementReplyDelegate(this.database).findUnique({
      where: { id: replyId },
    });
    if (!existing) throw notFound("Reply not found.");
    const row = await announcementReplyDelegate(this.database).update({
      where: { id: replyId },
      data: {
        hiddenAt: hidden ? new Date() : null,
        hiddenByUserId: hidden ? context.userId : null,
      },
      include: {
        author: { select: { firstName: true, lastName: true, displayName: true } },
      },
    });
    return serializeReply(row, { includeHidden: true });
  }

  public async createAnnouncement(
    context: AuthContext,
    input: CreateAnnouncementInput,
  ) {
    assertParityManage(context);
    const status = input.status ?? "published";
    const row = await this.database.announcement.create({
      data: {
        organizationId: context.organizationId,
        title: input.title,
        slug: input.slug.toLowerCase(),
        summary: input.summary ?? null,
        body: input.body,
        status,
        publishedAt:
          status === "published"
            ? input.publishedAt
              ? new Date(input.publishedAt)
              : new Date()
            : input.publishedAt
              ? new Date(input.publishedAt)
              : null,
        pinned: input.pinned ?? false,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
      include: ANNOUNCEMENT_MEDIA_INCLUDE,
    });
    if (status === "published") {
      await this.publishAnnouncementNotice(context, row);
    }
    return serializeAnnouncement(row);
  }

  public async updateAnnouncement(
    context: AuthContext,
    id: string,
    input: UpdateAnnouncementInput,
  ) {
    assertParityManage(context);
    const existing = await this.database.announcement.findFirst({
      where: {
        id,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!existing) throw notFound("Announcement not found.");
    const row = await this.database.announcement.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.slug !== undefined ? { slug: input.slug.toLowerCase() } : {}),
        ...(input.summary !== undefined ? { summary: input.summary ?? null } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.publishedAt !== undefined
          ? {
              publishedAt: input.publishedAt
                ? new Date(input.publishedAt)
                : null,
            }
          : input.status === "published" && !existing.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        ...(input.pinned !== undefined ? { pinned: input.pinned } : {}),
        ...(input.scheduledFor !== undefined
          ? {
              scheduledFor: input.scheduledFor
                ? new Date(input.scheduledFor)
                : null,
            }
          : {}),
        ...(input.expiresAt !== undefined
          ? {
              expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            }
          : {}),
      },
      include: ANNOUNCEMENT_MEDIA_INCLUDE,
    });
    const becamePublished =
      row.status === "published" && existing.status !== "published";
    if (becamePublished) {
      await this.publishAnnouncementNotice(context, row);
    }
    return serializeAnnouncement(row);
  }

  private async publishAnnouncementNotice(
    context: AuthContext,
    row: { id: string; title: string; summary: string | null },
  ) {
    await this.database.outboxEvent.create({
      data: {
        organizationId: context.organizationId,
        aggregateType: "announcement",
        aggregateId: row.id,
        eventType: "announcement.published",
        payload: {
          announcementId: row.id,
          announcementTitle: row.title,
          title: row.title,
          excerpt: row.summary ?? undefined,
          actorId: context.userId,
        },
      },
    });
  }

  public async deleteAnnouncement(context: AuthContext, id: string) {
    assertParityManage(context);
    const existing = await this.database.announcement.findFirst({
      where: {
        id,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!existing) throw notFound("Announcement not found.");
    await this.database.announcement.delete({ where: { id } });
  }

  public async attachAnnouncementMedia(
    context: AuthContext,
    announcementId: string,
    files: readonly UploadedFileInput[],
    requestId: string,
  ) {
    assertParityManage(context);
    const documents = this.requireDocuments();
    const announcement = await this.requireManagedAnnouncement(
      context,
      announcementId,
    );
    const existingCount = await this.database.announcementMedia.count({
      where: { announcementId },
    });
    if (existingCount + files.length > announcementUploadPolicy.maxFilesPerRequest) {
      throw new AppError({
        statusCode: 422,
        code: "UPLOAD_TOO_MANY",
        message: `At most ${announcementUploadPolicy.maxFilesPerRequest} media files may be attached.`,
      });
    }
    const saved = await documents.uploadMany(
      context,
      files,
      requestId,
      announcementUploadPolicy,
    );
    await this.database.$transaction(
      saved.map((document, index) =>
        this.database.announcementMedia.create({
          data: {
            announcementId,
            documentId: document.id,
            sortOrder: existingCount + index,
          },
        }),
      ),
    );
    const row = await this.database.announcement.findUniqueOrThrow({
      where: { id: announcement.id },
      include: ANNOUNCEMENT_MEDIA_INCLUDE,
    });
    return serializeAnnouncement(row);
  }

  public async deleteAnnouncementMedia(
    context: AuthContext,
    announcementId: string,
    mediaId: string,
  ) {
    assertParityManage(context);
    await this.requireManagedAnnouncement(context, announcementId);
    const media = await this.database.announcementMedia.findFirst({
      where: { id: mediaId, announcementId },
    });
    if (!media) throw notFound("Announcement media not found.");
    await this.database.announcementMedia.delete({ where: { id: mediaId } });
    const remainingAnnouncement = await this.database.announcementMedia.count({
      where: { documentId: media.documentId },
    });
    const remainingProcurement = await this.database.procurementRequestDocument.count(
      {
        where: { documentId: media.documentId },
      },
    );
    if (remainingAnnouncement === 0 && remainingProcurement === 0) {
      await this.database.storedDocument.update({
        where: { id: media.documentId },
        data: { deletedAt: new Date() },
      });
    }
    const row = await this.database.announcement.findUniqueOrThrow({
      where: { id: announcementId },
      include: ANNOUNCEMENT_MEDIA_INCLUDE,
    });
    return serializeAnnouncement(row);
  }

  public async openAnnouncementMedia(
    announcementId: string,
    mediaId: string,
    context?: AuthContext,
  ): Promise<{ document: StoredDocument; filename: string }> {
    const media = await this.database.announcementMedia.findFirst({
      where: { id: mediaId, announcementId },
      include: { announcement: true, document: true },
    });
    if (!media || media.document.deletedAt) {
      throw notFound("Announcement media not found.");
    }
    if (media.announcement.status === "published") {
      return {
        document: media.document,
        filename: media.document.originalFilename,
      };
    }
    if (!context) {
      throw notFound("Announcement media not found.");
    }
    assertParityManage(context);
    const orgOk =
      media.announcement.organizationId === context.organizationId ||
      media.announcement.organizationId === null;
    if (!orgOk) throw notFound("Announcement media not found.");
    return {
      document: media.document,
      filename: media.document.originalFilename,
    };
  }

  public openMediaStream(document: StoredDocument) {
    return this.requireDocuments().openReadStream(document);
  }

  private requireDocuments(): DocumentService {
    if (!this.documents) {
      throw new AppError({
        statusCode: 500,
        code: "INTERNAL_ERROR",
        message: "Document storage is not configured.",
      });
    }
    return this.documents;
  }

  private async requireManagedAnnouncement(
    context: AuthContext,
    id: string,
  ) {
    const existing = await this.database.announcement.findFirst({
      where: {
        id,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!existing) throw notFound("Announcement not found.");
    return existing;
  }

  public async submitMarketingContact(
    input: MarketingContactInput,
    context?: AuthContext,
  ) {
    const row = await this.database.marketingInquiry.create({
      data: {
        name: input.name,
        email: input.email,
        company: input.company ?? null,
        subject: input.subject ?? null,
        message: input.message,
        organizationId: context?.organizationId ?? null,
        userId: context?.userId ?? null,
      },
    });
    return {
      id: row.id,
      status: row.status,
      message: "Thanks - we received your message.",
    };
  }

  public async listMarketingInquiries(context: AuthContext) {
    assertParityManage(context);
    const rows = await this.database.marketingInquiry.findMany({
      where: {
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      company: row.company ?? undefined,
      subject: row.subject ?? undefined,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  public async getOrCreateSupportThread(context: AuthContext) {
    assertAuthenticated(context);
    const thread = await this.database.supportThread.upsert({
      where: {
        organizationId_requesterId: {
          organizationId: context.organizationId,
          requesterId: context.userId,
        },
      },
      create: {
        organizationId: context.organizationId,
        requesterId: context.userId,
        subject: "Support",
        status: "open",
      },
      update: {},
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 200 },
        requester: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    return {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      requesterId: thread.requesterId,
      requesterEmail: thread.requester?.email ?? "",
      requesterName: [thread.requester?.firstName, thread.requester?.lastName]
        .filter(Boolean)
        .join(" "),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      messages: thread.messages.map(serializeMessage),
    };
  }

  public async sendSupportMessage(
    context: AuthContext,
    input: SupportMessageInput,
  ) {
    assertAuthenticated(context);

    let thread = await this.database.supportThread.findUnique({
      where: {
        organizationId_requesterId: {
          organizationId: context.organizationId,
          requesterId: context.userId,
        },
      },
    });

    if (!thread) {
      thread = await this.database.supportThread.create({
        data: {
          organizationId: context.organizationId,
          requesterId: context.userId,
          subject: "Support",
          status: "open",
        },
      });
    }

    const threadId = thread.id;
    const message = await this.database.$transaction(async (tx) => {
      const created = await tx.supportMessage.create({
        data: {
          threadId,
          authorId: context.userId,
          body: input.body,
          fromOps: false,
        },
      });
      await tx.supportThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date(), status: "open" },
      });
      return created;
    });
    return serializeMessage(message);
  }

  public async replyAsOps(
    context: AuthContext,
    threadId: string,
    input: SupportMessageInput,
  ) {
    assertParityManage(context);
    const thread = await this.database.supportThread.findFirst({
      where: context.permissionKeys.has("ops:access")
        ? { id: threadId }
        : { id: threadId, organizationId: context.organizationId },
    });
    if (!thread) throw notFound("Support thread not found.");
    const message = await this.database.$transaction(async (tx) => {
      const created = await tx.supportMessage.create({
        data: {
          threadId,
          authorId: context.userId,
          body: input.body,
          fromOps: true,
        },
      });
      await tx.supportThread.update({
        where: { id: threadId },
        data: { updatedAt: new Date(), status: "open" },
      });
      return created;
    });
    return serializeMessage(message);
  }

  public async markMessageRead(context: AuthContext, messageId: string) {
    assertAuthenticated(context);
    const message = await this.database.supportMessage.findFirst({
      where: { id: messageId },
      include: { thread: true },
    });
    if (
      !message ||
      (!context.permissionKeys.has("ops:access") &&
        message.thread.organizationId !== context.organizationId)
    ) {
      throw notFound("Message not found.");
    }
    if (
      message.thread.requesterId !== context.userId &&
      !context.permissionKeys.has("communication:manage") &&
      !context.permissionKeys.has("ops:access") &&
      !context.permissionKeys.has("request:manage") &&
      !context.permissionKeys.has("guidance:manage")
    ) {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "You cannot mark this message as read.",
      });
    }
    const updated = await this.database.supportMessage.update({
      where: { id: messageId },
      data: { readAt: new Date() },
    });
    return serializeMessage(updated);
  }

  public async unreadCount(context: AuthContext) {
    assertAuthenticated(context);
    if (context.permissionKeys.has("ops:access")) {
      const count = await this.database.supportMessage.count({
        where: {
          fromOps: false,
          readAt: null,
        },
      });
      return { count };
    }
    const thread = await this.database.supportThread.findUnique({
      where: {
        organizationId_requesterId: {
          organizationId: context.organizationId,
          requesterId: context.userId,
        },
      },
      select: { id: true },
    });
    if (!thread) return { count: 0 };
    const count = await this.database.supportMessage.count({
      where: {
        threadId: thread.id,
        fromOps: true,
        readAt: null,
      },
    });
    return { count };
  }

  public async listOrgSupportThreads(context: AuthContext) {
    assertParityManage(context);
    const threads = await this.database.supportThread.findMany({
      where: context.permissionKeys.has("ops:access")
        ? {}
        : { organizationId: context.organizationId },
      orderBy: { updatedAt: "desc" },
      include: {
        requester: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: { select: { messages: true } },
      },
    });
    const unreadRows =
      threads.length === 0
        ? []
        : await this.database.supportMessage.groupBy({
            by: ["threadId"],
            where: {
              threadId: { in: threads.map((thread) => thread.id) },
              fromOps: false,
              readAt: null,
            },
            _count: { _all: true },
          });
    const unreadByThread = new Map(
      unreadRows.map((row) => [row.threadId, row._count._all]),
    );
    return threads.map((thread) => ({
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      requesterId: thread.requesterId,
      requesterEmail: thread.requester?.email ?? "",
      requesterName: [thread.requester?.firstName, thread.requester?.lastName]
        .filter(Boolean)
        .join(" "),
      messageCount: thread._count.messages,
      unreadCount: unreadByThread.get(thread.id) ?? 0,
      lastMessage: thread.messages[0]
        ? serializeMessage(thread.messages[0])
        : null,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    }));
  }

  public async getSupportThreadForOps(context: AuthContext, threadId: string) {
    assertParityManage(context);
    const thread = await this.database.supportThread.findFirst({
      where: context.permissionKeys.has("ops:access")
        ? { id: threadId }
        : { id: threadId, organizationId: context.organizationId },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 500 },
        requester: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    if (!thread) throw notFound("Support thread not found.");
    return {
      id: thread.id,
      subject: thread.subject,
      status: thread.status,
      requesterId: thread.requesterId,
      requesterEmail: thread.requester?.email ?? "",
      requesterName: [thread.requester?.firstName, thread.requester?.lastName]
        .filter(Boolean)
        .join(" "),
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
      messages: thread.messages.map(serializeMessage),
    };
  }

  public async autoRespond(context: AuthContext, input: AutoRespondInput) {
    assertAuthenticated(context);
    const haystack = input.message.toLowerCase();
    const articles = await this.database.knowledgeArticle.findMany({
      where: {
        active: true,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { hitCount: "desc" },
      take: 100,
    });

    let best:
      | {
          article: (typeof articles)[number];
          score: number;
        }
      | undefined;

    for (const article of articles) {
      let score = 0;
      for (const keyword of article.keywords) {
        const needle = keyword.trim().toLowerCase();
        if (needle && haystack.includes(needle)) score += 2;
      }
      const question = article.question.toLowerCase();
      for (const token of question.split(/\W+/).filter((t) => t.length > 3)) {
        if (haystack.includes(token)) score += 1;
      }
      if (score > 0 && (!best || score > best.score)) {
        best = { article, score };
      }
    }

    if (!best) {
      return {
        matched: false as const,
        reply:
          "I could not find a matching knowledge article. A specialist will follow up shortly.",
      };
    }

    await this.database.knowledgeArticle.update({
      where: { id: best.article.id },
      data: { hitCount: { increment: 1 } },
    });

    return {
      matched: true as const,
      articleId: best.article.id,
      question: best.article.question,
      reply: best.article.answer,
      score: best.score,
    };
  }

  public async listActiveServices() {
    const rows = await this.database.platformService.findMany({
      where: { status: "active" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map(serializeService);
  }

  public async listKnowledgeArticles(context: AuthContext) {
    assertParityManage(context);
    const rows = await this.database.knowledgeArticle.findMany({
      where: {
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(serializeKnowledge);
  }

  public async createKnowledgeArticle(
    context: AuthContext,
    input: CreateKnowledgeArticleInput,
  ) {
    assertParityManage(context);
    const row = await this.database.knowledgeArticle.create({
      data: {
        organizationId: context.organizationId,
        authorId: context.userId,
        question: input.question,
        answer: input.answer,
        keywords: input.keywords ?? [],
        active: input.active ?? true,
      },
    });
    return serializeKnowledge(row);
  }

  public async updateKnowledgeArticle(
    context: AuthContext,
    id: string,
    input: UpdateKnowledgeArticleInput,
  ) {
    assertParityManage(context);
    const existing = await this.database.knowledgeArticle.findFirst({
      where: {
        id,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!existing) throw notFound("Knowledge article not found.");
    const row = await this.database.knowledgeArticle.update({
      where: { id },
      data: {
        ...(input.question !== undefined ? { question: input.question } : {}),
        ...(input.answer !== undefined ? { answer: input.answer } : {}),
        ...(input.keywords !== undefined ? { keywords: input.keywords } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    return serializeKnowledge(row);
  }

  public async deleteKnowledgeArticle(context: AuthContext, id: string) {
    assertParityManage(context);
    const existing = await this.database.knowledgeArticle.findFirst({
      where: {
        id,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!existing) throw notFound("Knowledge article not found.");
    await this.database.knowledgeArticle.delete({ where: { id } });
  }

  public async listPlatformServicesAdmin(context: AuthContext) {
    assertParityManage(context);
    const rows = await this.database.platformService.findMany({
      where: {
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map(serializeService);
  }

  public async createPlatformService(
    context: AuthContext,
    input: CreatePlatformServiceInput,
  ) {
    assertParityManage(context);
    const row = await this.database.platformService.create({
      data: {
        organizationId: context.organizationId,
        name: input.name,
        slug: input.slug.toLowerCase(),
        summary: input.summary ?? null,
        body: input.body ?? null,
        status: input.status ?? "active",
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return serializeService(row);
  }

  public async updatePlatformService(
    context: AuthContext,
    id: string,
    input: UpdatePlatformServiceInput,
  ) {
    assertParityManage(context);
    const existing = await this.database.platformService.findFirst({
      where: {
        id,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!existing) throw notFound("Platform service not found.");
    const row = await this.database.platformService.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug.toLowerCase() } : {}),
        ...(input.summary !== undefined ? { summary: input.summary ?? null } : {}),
        ...(input.body !== undefined ? { body: input.body ?? null } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    return serializeService(row);
  }

  public async deletePlatformService(context: AuthContext, id: string) {
    assertParityManage(context);
    const existing = await this.database.platformService.findFirst({
      where: {
        id,
        OR: [
          { organizationId: context.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!existing) throw notFound("Platform service not found.");
    await this.database.platformService.delete({ where: { id } });
  }
}
