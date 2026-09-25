import type { AuthContext } from "../../../shared/auth/auth-context.js";
import { prioritizedProductSlugs, restoreProductOrder } from "../../catalog/application/prioritized-product-page.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import {
  categoryWriteData,
  mediaWriteData,
  withCategoryMedia,
} from "../../../shared/database/database-client.js";
import { AppError } from "../../../lib/app-error.js";
import type { UploadedFileInput } from "../../media/document/application/document-service.js";
import {
  createCatalogMediaStore,
  type CatalogMediaStore,
} from "../../catalog/infrastructure/catalog-media-store.js";
import { parseStoredCatalogMediaUrl } from "../../catalog/infrastructure/catalog-media-path.js";
import {
  sniffCatalogMediaMime,
  validateCatalogMediaUpload,
} from "../../catalog/infrastructure/catalog-media-policy.js";
import type {
  OpsListQuery,
  OpsReportInput,
  CreateOpsProductInput,
  UpdateOpsProductInput,
  CreateOpsCategoryInput,
  UpdateOpsCategoryInput,
  CreateOpsProductImageInput,
  UpdateOpsProductImageInput,
  CreateOpsProductVideoInput,
  UpdateOpsProductVideoInput,
  CreateOpsBrandInput,
  CreateOpsManufacturerInput,
  UserAccountStatusInput,
  UserOpsAccessInput,
  UserProfileInput,
} from "../api/ops-schemas.js";
import {
  OPS_ADMIN_ROLE_KEYS,
  OpsIdentityAdmin,
  isUserAccountStatus,
} from "./ops-identity-admin.js";

type Meta = { page: number; pageSize: number; total: number; hasMore: boolean };

function pageMeta(total: number, page: number, pageSize: number): Meta {
  return {
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

function requireOrg(context: AuthContext): string {
  if (!context.organizationId) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "Organization context is required for operations console.",
    });
  }
  return context.organizationId;
}

function tallyStatuses(
  rows: ReadonlyArray<{ status: string; _count: { _all: number } }>,
): Record<string, number> {
  const tallies: Record<string, number> = {};
  for (const row of rows) {
    tallies[row.status] = row._count._all;
  }
  return tallies;
}

function sumStatuses(
  tallies: Record<string, number>,
  statuses: readonly string[],
): number {
  return statuses.reduce((total, status) => total + (tallies[status] ?? 0), 0);
}

function dailySeries(dates: readonly Date[], days: number, now = new Date()) {
  const buckets = new Map<string, number>();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - offset),
    );
    buckets.set(day.toISOString().slice(0, 10), 0);
  }
  for (const date of dates) {
    const key = date.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

function mapAuditCategory(resourceType: string, action: string): string {
  if (action.includes("login") || action.includes("auth")) return "authentication";
  if (resourceType.includes("payment") || resourceType.includes("invoice"))
    return "payments";
  if (resourceType.includes("supplier")) return "supplier_updates";
  if (resourceType.includes("role") || resourceType.includes("permission"))
    return "permission_changes";
  if (resourceType.includes("cms") || resourceType.includes("guidance"))
    return "cms_changes";
  if (resourceType.includes("report") || action.includes("ops."))
    return "security_events";
  return "procurement_actions";
}

function humanizeAuditSummary(
  action: string,
  resourceType: string,
  resourceId: string | null,
): string {
  const a = action.toLowerCase();
  const resource = resourceType.replaceAll("_", " ");
  const idBit = resourceId ? ` (${resourceId})` : "";

  if (a.includes("login") && (a.includes("success") || a.includes(".ok"))) {
    return "Someone signed in successfully";
  }
  if (a.includes("login") && (a.includes("fail") || a.includes("denied"))) {
    return "Sign-in attempt failed";
  }
  if (a.includes("logout")) return "Someone signed out";
  if (a.includes("password") && a.includes("reset")) {
    return "Password reset was completed";
  }
  if (a.includes("password") && a.includes("change")) {
    return "Password was changed";
  }
  if (a.includes("mfa") || a.includes("otp") || a.includes("2fa")) {
    return "Extra security check was used";
  }
  if (a.includes("role") && a.includes("assign")) {
    return `A role was assigned${idBit}`;
  }
  if (a.includes("permission") && (a.includes("grant") || a.includes("allow"))) {
    return `Access permission was granted${idBit}`;
  }
  if (a.includes("permission") && (a.includes("revoke") || a.includes("deny"))) {
    return `Access permission was removed${idBit}`;
  }
  if (a.includes("approve")) return `Approved a ${resource}${idBit}`;
  if (a.includes("reject") || a.includes("deny")) {
    return `Rejected a ${resource}${idBit}`;
  }
  if (a.includes("submit")) return `Submitted a ${resource}${idBit}`;
  if (a.includes("publish")) return `Published a ${resource}${idBit}`;
  if (a.includes("create") || a.includes("created")) {
    return `Created a ${resource}${idBit}`;
  }
  if (a.includes("update") || a.includes("updated") || a.includes("patch")) {
    return `Updated a ${resource}${idBit}`;
  }
  if (a.includes("delete") || a.includes("removed") || a.includes("archive")) {
    return `Removed a ${resource}${idBit}`;
  }
  if (a.includes("export") && a.includes("block")) {
    return "An export attempt was blocked";
  }
  if (a.includes("export")) return `Exported ${resource} data`;
  if (a.includes("download")) return `Downloaded a ${resource}${idBit}`;
  if (a.includes("upload")) return `Uploaded a ${resource}${idBit}`;
  if (a.includes("payment") || a.includes("pay.")) {
    return `Payment activity on ${resource}${idBit}`;
  }
  if (a.includes("ship")) return `Shipment update${idBit}`;
  if (a.includes("invite")) return `Sent an invitation${idBit}`;
  if (a.includes("verify")) return `Verified ${resource}${idBit}`;
  if (a.includes("token") && a.includes("reuse")) {
    return "Suspicious session reuse was blocked";
  }

  const last = action.split(".").pop()?.replaceAll("_", " ") ?? "change";
  return `${last.charAt(0).toUpperCase()}${last.slice(1)} on ${resource}${idBit}`;
}

const opsProductListInclude = {
  category: true,
  brand: true,
  manufacturer: true,
  images: { orderBy: { position: "asc" as const }, take: 3 },
  videos: { take: 0 },
};

const opsProductInclude = {
  category: true,
  brand: true,
  manufacturer: true,
  images: { orderBy: { position: "asc" as const } },
  videos: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { createdAt: "asc" as const } },
};

type OpsProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  categoryId: string | null;
  description: string | null;
  catalogueId?: string | null;
  summary?: string | null;
  entryType?: string;
  availabilityStatus?: string;
  manufacturerUrl?: string | null;
  verificationStatus?: string | null;
  mediaStatus?: string | null;
  heroImagePolicy?: string | null;
  sourceManifestVersion?: string | null;
  releaseDate?: Date | null;
  catalogueNotes?: string | null;
  brandId: string | null;
  manufacturerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { name: string } | null;
  brand: { name: string } | null;
  manufacturer: { legalName: string; countryCode: string | null } | null;
  images: {
    id: string;
    url: string;
    altText: string | null;
    position: number;
  }[];
  videos?: {
    id: string;
    url: string;
    title: string | null;
    caption: string | null;
    position: number;
  }[];
  variants?: {
    id: string;
    sku: string | null;
    name: string;
    specifications: unknown;
  }[];
};

function mapOpsProduct(row: OpsProductRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    description: row.description,
    catalogueId: row.catalogueId ?? null,
    summary: row.summary ?? null,
    entryType: row.entryType ?? "STANDARD_PRODUCT",
    availabilityStatus: row.availabilityStatus ?? "ON_REQUEST",
    manufacturerUrl: row.manufacturerUrl ?? null,
    verificationStatus: row.verificationStatus ?? null,
    mediaStatus: row.mediaStatus ?? null,
    heroImagePolicy: row.heroImagePolicy ?? null,
    sourceManifestVersion: row.sourceManifestVersion ?? null,
    releaseDate: row.releaseDate?.toISOString().slice(0, 10) ?? null,
    catalogueNotes: row.catalogueNotes ?? null,
    brandId: row.brandId,
    brandName: row.brand?.name ?? null,
    manufacturerId: row.manufacturerId,
    manufacturerName: row.manufacturer?.legalName ?? null,
    manufacturerCountry: row.manufacturer?.countryCode ?? null,
    images: row.images.map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
      position: image.position,
    })),
    videos: (row.videos ?? []).map((video) => ({
      id: video.id,
      url: video.url,
      title: video.title,
      caption: video.caption,
      position: video.position,
    })),
    variants: (row.variants ?? []).map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      name: variant.name,
      specifications: variant.specifications,
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function deriveSlug(name: string, fallback: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 200) || fallback
  );
}

function assertPublishable(input: {
  status: string;
  categoryId: string | null;
  description: string | null;
}): void {
  if (input.status !== "published") return;
  const details: { field: string; message: string; code: string }[] = [];
  if (!input.categoryId) {
    details.push({
      field: "categoryId",
      code: "too_small",
      message: "A published product must belong to a category.",
    });
  }
  if (!input.description?.trim()) {
    details.push({
      field: "description",
      code: "too_small",
      message: "A published product must include a description.",
    });
  }
  if (details.length === 0) return;
  throw new AppError({
    statusCode: 422,
    code: "VALIDATION_ERROR",
    message: "Published products require a category and description.",
    details,
  });
}

function actorLabel(actor: {
  firstName: string;
  lastName: string;
  email: string;
} | null): string {
  if (!actor) return "System";
  const name = [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim();
  return name || actor.email;
}

/**
 * Operations console aggregations and directories - org-scoped where models allow.
 */
export class OpsService {
  constructor(
    private readonly database: DatabaseClient,
    uploadRoot = "uploads",
    private readonly catalogMedia: CatalogMediaStore = createCatalogMediaStore({
      uploadRoot,
    }),
  ) {}

  async updateUserAccountStatus(
    context: AuthContext,
    userId: string,
    input: UserAccountStatusInput,
  ) {
    requireOrg(context);
    return new OpsIdentityAdmin(this.database).updateAccountStatus(
      context,
      userId,
      input,
    );
  }

  async updateUserOpsAccess(
    context: AuthContext,
    userId: string,
    input: UserOpsAccessInput,
  ) {
    requireOrg(context);
    return new OpsIdentityAdmin(this.database).updateOpsAccess(
      context,
      userId,
      input,
    );
  }

  async updateUserProfile(
    context: AuthContext,
    userId: string,
    input: UserProfileInput,
  ) {
    const organizationId = requireOrg(context);
    const membership = await this.database.organizationMembership.findFirst({
      where: { userId, organizationId },
      select: { id: true },
    });
    if (!membership) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "User is not a member of this organization.",
      });
    }
    const before = await this.database.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, displayName: true },
    });
    if (!before) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "User not found." });
    }
    await this.database.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: input.displayName?.trim() || null,
        },
      });
      await tx.auditEvent.create({
        data: {
          organizationId,
          actorId: context.userId,
          action: "ops.identity.user.profile.update",
          resourceType: "user",
          resourceId: userId,
          metadata: { before, after: input },
        },
      });
    });
    return this.identityDirectory(context, {
      page: 1,
      pageSize: 1,
      userId,
    }).then((directory) => directory.members[0]);
  }

  async dashboard(context: AuthContext) {
    requireOrg(context);
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [
      requestStatuses,
      quotationStatuses,
      productStatuses,
      shipmentStatuses,
      invoiceStatuses,
      paymentCount,
      unreadNotifications,
      announcementDrafts,
      recentAudit,
      recentProducts,
      recentRequests,
      recentQuotations,
      recentShipments,
      requestDates,
      invoiceAgg,
      userCount,
      organizationCount,
    ] = await Promise.all([
      this.database.procurementRequest.groupBy({
        by: ["status"],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.database.quotation.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.database.product.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.database.shipment.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.database.invoice.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      this.database.payment.count(),
      this.database.notification.count({
        where: { status: "unread", deletedAt: null },
      }),
      this.database.announcement.count({ where: { status: "draft" } }),
      this.database.auditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.database.product.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          updatedAt: true,
          category: { select: { name: true } },
        },
      }),
      this.database.procurementRequest.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          publicCode: true,
          title: true,
          status: true,
          lob: true,
          createdAt: true,
          organization: { select: { displayName: true } },
          requester: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.database.quotation.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          publicCode: true,
          status: true,
          updatedAt: true,
        },
      }),
      this.database.shipment.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          publicCode: true,
          status: true,
          updatedAt: true,
        },
      }),
      this.database.procurementRequest.findMany({
        where: { deletedAt: null, createdAt: { gte: since90 } },
        select: { createdAt: true },
      }),
      this.database.invoice.aggregate({
        where: { status: { in: ["issued", "partially_paid", "paid"] } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      this.database.user.count(),
      this.database.organization.count(),
    ]);

    const requestTallies = tallyStatuses(requestStatuses);
    const quotationTallies = tallyStatuses(quotationStatuses);
    const productTallies = tallyStatuses(productStatuses);
    const shipmentTallies = tallyStatuses(shipmentStatuses);
    const invoiceTallies = tallyStatuses(invoiceStatuses);
    const requestCount = Object.values(requestTallies).reduce((a, b) => a + b, 0);
    const quotationCount = Object.values(quotationTallies).reduce((a, b) => a + b, 0);
    const shipmentCount = Object.values(shipmentTallies).reduce((a, b) => a + b, 0);
    const publishedProductCount = productTallies.published ?? 0;
    const draftProductCount = productTallies.draft ?? 0;
    const archivedProductCount = productTallies.archived ?? 0;
    const pipelineCount = sumStatuses(requestTallies, [
      "submitted",
      "needs_clarification",
      "accepted_for_sourcing",
      "sourcing",
      "quote_issued",
      "revision_requested",
    ]);
    const openApprovals = sumStatuses(requestTallies, [
      "submitted",
      "needs_clarification",
      "revision_requested",
    ]);
    const quotationsAwaiting = sumStatuses(quotationTallies, [
      "draft",
      "internally_reviewed",
    ]);
    const issuedQuotations = quotationTallies.issued ?? 0;
    const activeShipments = sumStatuses(shipmentTallies, [
      "planned",
      "supplier_ready",
      "pickup_scheduled",
      "picked_up",
      "export_cleared",
      "departed",
      "arrived",
      "import_cleared",
      "warehouse_received",
      "dispatched",
      "out_for_delivery",
      "held",
    ]);
    const outstandingInvoices = sumStatuses(invoiceTallies, [
      "issued",
      "partially_paid",
    ]);
    const revenue = Number(invoiceAgg._sum.totalAmount ?? 0);
    const generatedAt = new Date().toISOString();
    const requestDatesOnly = requestDates.map((row) => row.createdAt);

    const attention = [
      {
        id: "attention-requests",
        label: "Procurement requests awaiting action",
        count: openApprovals,
        href: "/requests?status=submitted",
      },
      {
        id: "attention-quotations",
        label: "Quotations awaiting review or issue",
        count: quotationsAwaiting,
        href: "/quotations?status=draft",
      },
      {
        id: "attention-issued-quotes",
        label: "Issued quotations awaiting buyer decision",
        count: issuedQuotations,
        href: "/quotations?status=issued",
      },
      {
        id: "attention-draft-products",
        label: "Draft products awaiting publication",
        count: draftProductCount,
        href: "/products?status=draft",
      },
      {
        id: "attention-invoices",
        label: "Outstanding invoices",
        count: outstandingInvoices,
        href: "/invoices",
      },
      {
        id: "attention-shipments",
        label: "Active shipments",
        count: activeShipments,
        href: "/shipments",
      },
      {
        id: "attention-notifications",
        label: "Unread notifications",
        count: unreadNotifications,
        href: "/notifications",
      },
      {
        id: "attention-announcements",
        label: "Draft announcements",
        count: typeof announcementDrafts === "number" ? announcementDrafts : 0,
        href: "/cms",
      },
    ].filter((item) => item.count > 0);

    const requestPipeline = [
      {
        id: "submitted",
        label: "Submitted",
        count: requestTallies.submitted ?? 0,
        href: "/requests?status=submitted",
      },
      {
        id: "clarification",
        label: "Clarification",
        count: sumStatuses(requestTallies, [
          "needs_clarification",
          "revision_requested",
        ]),
        href: "/requests?status=needs_clarification",
      },
      {
        id: "sourcing",
        label: "Sourcing",
        count: sumStatuses(requestTallies, [
          "accepted_for_sourcing",
          "sourcing",
        ]),
        href: "/requests?status=sourcing",
      },
      {
        id: "quoted",
        label: "Quoted",
        count: requestTallies.quote_issued ?? 0,
        href: "/requests?status=quote_issued",
      },
      {
        id: "approved",
        label: "Approved",
        count: sumStatuses(requestTallies, [
          "approved",
          "purchase_in_progress",
        ]),
        href: "/requests?status=approved",
      },
      {
        id: "fulfilled",
        label: "Fulfilled",
        count: sumStatuses(requestTallies, ["fulfilled", "closed"]),
        href: "/requests?status=fulfilled",
      },
    ];

    return {
      generatedAt,
      kpis: [
        {
          id: "kpi-orders",
          label: "Procurement requests",
          value: String(requestCount),
          delta: `${pipelineCount} in pipeline`,
          tone: pipelineCount > 0 ? "warning" : "neutral",
          definition: "All procurement requests across Almahbub",
          timeRange: "All time",
          freshness: `Updated ${generatedAt}`,
          href: "/requests",
        },
        {
          id: "kpi-quotes",
          label: "Quotations",
          value: String(quotationCount),
          delta: `${issuedQuotations} issued`,
          tone: "neutral",
          definition: "Quotation records",
          timeRange: "All time",
          freshness: `Updated ${generatedAt}`,
          href: "/quotations",
        },
        {
          id: "kpi-shipments",
          label: "Shipments",
          value: String(shipmentCount),
          delta: `${activeShipments} active`,
          tone: "neutral",
          definition: "Logistics shipments",
          timeRange: "All time",
          freshness: `Updated ${generatedAt}`,
          href: "/shipments",
        },
        {
          id: "kpi-published-products",
          label: "Published catalogue",
          value: String(publishedProductCount),
          delta: `${draftProductCount} draft · ${archivedProductCount} archived`,
          tone: publishedProductCount > 0 ? "positive" : "neutral",
          definition: "Products visible on the public catalogue",
          timeRange: "Current",
          freshness: `Updated ${generatedAt}`,
          href: "/products",
        },
        {
          id: "kpi-invoices",
          label: "Invoices",
          value: String(invoiceAgg._count),
          delta: `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} invoiced`,
          tone: revenue > 0 ? "positive" : "neutral",
          definition: "Issued, partially paid, and paid invoices",
          timeRange: "All time",
          freshness: `Updated ${generatedAt}`,
          href: "/invoices",
        },
        {
          id: "kpi-payments",
          label: "Payments",
          value: String(paymentCount),
          tone: "neutral",
          definition: "Payment records",
          timeRange: "All time",
          freshness: `Updated ${generatedAt}`,
          href: "/payments",
        },
        {
          id: "kpi-users",
          label: "Users",
          value: String(userCount),
          tone: "neutral",
          definition: "Platform user accounts",
          timeRange: "Current",
          freshness: `Updated ${generatedAt}`,
          href: "/users",
        },
        {
          id: "kpi-organizations",
          label: "Organisations",
          value: String(organizationCount),
          tone: "neutral",
          definition: "Buyer and partner organisations",
          timeRange: "Current",
          freshness: `Updated ${generatedAt}`,
          href: "/organizations",
        },
      ],
      attention,
      requestPipeline,
      catalogue: {
        published: publishedProductCount,
        draft: draftProductCount,
        archived: archivedProductCount,
      },
      quotationBreakdown: quotationTallies,
      shipmentBreakdown: shipmentTallies,
      requestSeries: {
        "7d": dailySeries(requestDatesOnly, 7),
        "30d": dailySeries(requestDatesOnly, 30),
        "90d": dailySeries(requestDatesOnly, 90),
      },
      recentProducts: recentProducts.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        status: product.status,
        categoryName: product.category?.name ?? null,
        updatedAt: product.updatedAt.toISOString(),
        href: "/products",
      })),
      recentRequests: recentRequests.map((request) => ({
        id: request.id,
        publicCode: request.publicCode,
        title: request.title,
        status: request.status,
        organizationName: request.organization?.displayName ?? null,
        requesterName:
          [request.requester?.firstName, request.requester?.lastName]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          request.requester?.email ||
          null,
        createdAt: request.createdAt.toISOString(),
        href: "/requests",
      })),
      recentQuotations: recentQuotations.map((quotation) => ({
        id: quotation.id,
        publicCode: quotation.publicCode,
        status: quotation.status,
        updatedAt: quotation.updatedAt.toISOString(),
        href: "/quotations",
      })),
      recentShipments: recentShipments.map((shipment) => ({
        id: shipment.id,
        publicCode: shipment.publicCode,
        status: shipment.status,
        updatedAt: shipment.updatedAt.toISOString(),
        href: "/shipments",
      })),
      approvalQueue: { count: openApprovals, href: "/requests" },
      finance: {
        invoiceCount: invoiceAgg._count,
        paymentCount,
        revenue,
      },
      recentActivity: recentAudit.map((event) => ({
        id: event.id,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        actorName: actorLabel(event.actor),
        occurredAt: event.createdAt.toISOString(),
      })),
      alerts: [
        ...(openApprovals > 0
          ? [
              {
                id: "alert-approvals",
                tone: "warning" as const,
                title: `${openApprovals} requests need attention`,
                href: "/requests",
              },
            ]
          : []),
      ],
      quickActions: [
        { id: "qa-requests", label: "Review requests", href: "/requests", permission: "ops:access" },
        { id: "qa-quotes", label: "Review quotations", href: "/quotations", permission: "ops:access" },
        { id: "qa-products", label: "Manage products", href: "/products", permission: "cms:manage" },
        { id: "qa-categories", label: "Manage categories", href: "/categories", permission: "ops:access" },
        { id: "qa-shipments", label: "View shipments", href: "/shipments", permission: "ops:access" },
        { id: "qa-invoices", label: "View invoices", href: "/invoices", permission: "ops:access" },
        { id: "qa-payments", label: "View payments", href: "/payments", permission: "ops:access" },
        { id: "qa-announcement", label: "Manage announcements", href: "/cms", permission: "ops:access" },
        { id: "qa-users", label: "View users", href: "/users", permission: "ops:access" },
      ],
    };
  }

  async listAuditEvents(context: AuthContext, query: OpsListQuery) {
    requireOrg(context);
    const where = {
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: query.from } : {}),
              ...(query.to ? { lte: query.to } : {}),
            },
          }
        : {}),
      ...(query.q
        ? {
            OR: [
              { action: { contains: query.q, mode: "insensitive" as const } },
              {
                resourceType: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };
    const total = await this.database.auditEvent.count({ where });
    const rows = await this.database.auditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return {
      data: rows.map((event) => {
        const metadata =
          event.metadata &&
          typeof event.metadata === "object" &&
          !Array.isArray(event.metadata)
            ? (event.metadata as Record<string, unknown>)
            : {};
        return {
          id: event.id,
          category: mapAuditCategory(event.resourceType, event.action),
          action: event.action,
          summary: humanizeAuditSummary(
            event.action,
            event.resourceType,
            event.resourceId,
          ),
          outcome: "success",
          severity: "medium",
          actor: {
            ...(event.actorId ? { id: event.actorId } : {}),
            name: actorLabel(event.actor),
            type: event.actorId ? "user" : "system",
          },
          target: {
            type: event.resourceType,
            id: event.resourceId,
            label: event.resourceId,
          },
          occurredAt: event.createdAt.toISOString(),
          ...(event.requestId ? { requestId: event.requestId } : {}),
          metadata: {
            ...metadata,
            before: metadata.before ?? metadata.previous ?? null,
            after: metadata.after ?? metadata.next ?? metadata,
          },
          retentionClass: "standard",
          legalHold: false,
        };
      }),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  async identityDirectory(context: AuthContext, query: OpsListQuery) {
    const organizationId = requireOrg(context);
    const accountStatus =
      query.userStatus ??
      (query.status && isUserAccountStatus(query.status) ? query.status : undefined);
    const membershipStatus =
      query.status && !isUserAccountStatus(query.status) ? query.status : undefined;
    const memberWhere = {
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(membershipStatus ? { status: membershipStatus as never } : {}),
      ...(accountStatus ? { user: { status: accountStatus } } : {}),
      ...(query.q
        ? {
            OR: [
              {
                user: {
                  OR: [
                    { email: { contains: query.q, mode: "insensitive" as const } },
                    { firstName: { contains: query.q, mode: "insensitive" as const } },
                    { lastName: { contains: query.q, mode: "insensitive" as const } },
                  ],
                },
              },
              {
                organization: {
                  OR: [
                    {
                      displayName: {
                        contains: query.q,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      legalName: {
                        contains: query.q,
                        mode: "insensitive" as const,
                      },
                    },
                    { slug: { contains: query.q, mode: "insensitive" as const } },
                  ],
                },
              },
            ],
          }
        : {}),
    };
    const [
      organization,
      members,
      memberTotal,
      invitations,
      roles,
      permissions,
      sessions,
      organizations,
      requestCounts,
      orgRequestCounts,
    ] = await Promise.all([
        this.database.organization.findUniqueOrThrow({
          where: { id: organizationId },
        }),
        this.database.organizationMembership.findMany({
          where: memberWhere,
          include: {
            user: true,
            organization: true,
            roles: { include: { role: true } },
          },
          orderBy: { createdAt: "desc" },
          take: query.pageSize,
          skip: (query.page - 1) * query.pageSize,
        }),
        this.database.organizationMembership.count({ where: memberWhere }),
        this.database.organizationInvitation.findMany({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        this.database.role.findMany({
          include: { permissions: { include: { permission: true } } },
          take: 200,
        }),
        this.database.permission.findMany({
          orderBy: { key: "asc" },
          take: 200,
        }),
        this.database.userSession.findMany({
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        this.database.organization.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          include: { _count: { select: { memberships: true } } },
        }),
        this.database.procurementRequest.groupBy({
          by: ["requesterId"],
          where: { deletedAt: null },
          _count: { _all: true },
        }),
        this.database.procurementRequest.groupBy({
          by: ["organizationId"],
          where: { deletedAt: null },
          _count: { _all: true },
        }),
      ]);

    const requestCountByUser = new Map(
      requestCounts.map((row) => [row.requesterId, row._count._all]),
    );
    const requestCountByOrg = new Map(
      orgRequestCounts.map((row) => [row.organizationId, row._count._all]),
    );

    return {
      organization: {
        id: organization.id,
        name: organization.displayName,
        legalName: organization.legalName,
        slug: organization.slug,
        status: organization.status,
      },
      organizations: organizations.map((org) => ({
        id: org.id,
        name: org.displayName,
        legalName: org.legalName,
        slug: org.slug,
        status: org.status,
        countryCode: org.countryCode,
        memberCount: org._count.memberships,
        requestCount: requestCountByOrg.get(org.id) ?? 0,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      })),
      members: members.map((membership) => ({
        id: membership.id,
        userId: membership.userId,
        status: membership.status,
        email: membership.user.email,
        firstName: membership.user.firstName,
        lastName: membership.user.lastName,
        displayName: membership.user.displayName,
        userStatus: membership.user.status,
        emailVerifiedAt:
          membership.user.emailVerifiedAt?.toISOString() ?? null,
        lastAuthenticatedAt:
          membership.user.lastAuthenticatedAt?.toISOString() ?? null,
        organizationId: membership.organizationId,
        organizationName:
          membership.organization.displayName || membership.organization.legalName,
        organizationSlug: membership.organization.slug,
        requestCount: requestCountByUser.get(membership.userId) ?? 0,
        roles: membership.roles.map((link) => ({
          id: link.role.id,
          key: link.role.key,
          name: link.role.name,
        })),
        hasOpsAccess: membership.roles.some((link) =>
          (OPS_ADMIN_ROLE_KEYS as readonly string[]).includes(link.role.key),
        ),
        createdAt: membership.createdAt.toISOString(),
      })),
      invitations: invitations.map((invite) => ({
        id: invite.id,
        email: invite.email,
        status: invite.status,
        expiresAt: invite.expiresAt.toISOString(),
        createdAt: invite.createdAt.toISOString(),
      })),
      roles: roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        permissions: role.permissions.map((p) => p.permission.key),
      })),
      permissions: permissions.map((p) => ({
        id: p.id,
        key: p.key,
        description: p.description,
      })),
      sessions: sessions.map((session) => ({
        id: session.id,
        userId: session.userId,
        userEmail: session.user.email,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        ipHash: session.ipHash,
        userAgent: session.userAgent,
      })),
      page: pageMeta(memberTotal, query.page, query.pageSize),
    };
  }

  async listSuppliers(context: AuthContext, query: OpsListQuery) {
    requireOrg(context);
    const where = {
      ...(query.q
        ? {
            OR: [
              { legalName: { contains: query.q, mode: "insensitive" as const } },
              {
                countryCode: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status as never } : {}),
    };
    const total = await this.database.supplier.count({ where });
    const rows = await this.database.supplier.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.legalName,
        status: row.status,
        countryCode: row.countryCode,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  async listProducts(context: AuthContext, query: OpsListQuery) {
    requireOrg(context);
    const where = {
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" as const } },
              { slug: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };
    const total = await this.database.product.count({ where });
    const prioritySlugs = !query.sort || query.sort === "recommended"
      ? await prioritizedProductSlugs(this.database, where, query.page, query.pageSize) : null;
    const rows = await this.database.product.findMany({
      where: prioritySlugs ? { AND: [where, { slug: { in: prioritySlugs } }] } : where,
      orderBy: query.sort === "name" ? [{ name: "asc" }, { slug: "asc" }] : query.sort === "status" ? [{ status: "asc" }, { name: "asc" }, { slug: "asc" }] : [{ updatedAt: "desc" }, { slug: "asc" }],
      skip: prioritySlugs ? 0 : (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: opsProductListInclude,
    });
    return {
      data: (prioritySlugs ? restoreProductOrder(rows, prioritySlugs) : rows).map((row) => mapOpsProduct(row)),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  async getProduct(context: AuthContext, id: string) {
    requireOrg(context);
    const row = await this.database.product.findUnique({
      where: { id },
      include: opsProductInclude,
    });
    if (!row) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Product not found.",
      });
    }
    return mapOpsProduct(row);
  }

  async listCategories(context: AuthContext, query: OpsListQuery) {
    requireOrg(context);
    const where = {
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" as const } },
              { slug: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const total = await this.database.productCategory.count({ where });
    const rows = await this.database.productCategory.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { products: true } } },
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        parentId: row.parentId,
        description: withCategoryMedia(row).description,
        imageUrl: withCategoryMedia(row).imageUrl,
        productCount: row._count.products,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  async createProduct(context: AuthContext, input: CreateOpsProductInput) {
    requireOrg(context);
    const status = input.status ?? "draft";
    assertPublishable({
      status,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
    });
    let slug = input.slug?.toLowerCase() ?? deriveSlug(input.name, `product-${Date.now()}`);
    const base = slug;
    let suffix = 2;
    while (await this.database.product.findUnique({ where: { slug } })) {
      slug = `${base}-${suffix}`.slice(0, 200);
      suffix += 1;
    }
    const row = await this.database.product.create({
      data: {
        name: input.name,
        slug,
        status,
        categoryId: input.categoryId ?? null,
        description: input.description ?? null,
        summary: input.summary ?? null,
        entryType: input.entryType ?? "STANDARD_PRODUCT",
        availabilityStatus: input.availabilityStatus ?? "ON_REQUEST",
        manufacturerUrl: input.manufacturerUrl ?? null,
        releaseDate: input.releaseDate ?? null,
        catalogueNotes: input.catalogueNotes ?? null,
        brandId: input.brandId ?? null,
        manufacturerId: input.manufacturerId ?? null,
      },
      include: opsProductInclude,
    });
    return mapOpsProduct(row);
  }

  async updateProduct(
    context: AuthContext,
    id: string,
    input: UpdateOpsProductInput,
  ) {
    requireOrg(context);
    const existing = await this.database.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Product not found.",
      });
    }
    assertPublishable({
      status: input.status ?? existing.status,
      categoryId:
        input.categoryId !== undefined ? input.categoryId : existing.categoryId,
      description:
        input.description !== undefined
          ? input.description
          : existing.description,
    });
    const row = await this.database.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug.toLowerCase() } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.categoryId !== undefined
          ? { categoryId: input.categoryId }
          : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.entryType !== undefined ? { entryType: input.entryType } : {}),
        ...(input.availabilityStatus !== undefined
          ? { availabilityStatus: input.availabilityStatus }
          : {}),
        ...(input.manufacturerUrl !== undefined
          ? { manufacturerUrl: input.manufacturerUrl }
          : {}),
        ...(input.releaseDate !== undefined
          ? { releaseDate: input.releaseDate }
          : {}),
        ...(input.catalogueNotes !== undefined
          ? { catalogueNotes: input.catalogueNotes }
          : {}),
        ...(input.brandId !== undefined ? { brandId: input.brandId } : {}),
        ...(input.manufacturerId !== undefined
          ? { manufacturerId: input.manufacturerId }
          : {}),
      },
      include: opsProductInclude,
    });
    return mapOpsProduct(row);
  }

  async uploadProductImage(
    context: AuthContext,
    productId: string,
    file: UploadedFileInput,
  ) {
    requireOrg(context);
    await this.requireProduct(productId);
    const sniffed = sniffCatalogMediaMime(file.buffer) ?? file.mimeType;
    const issues = validateCatalogMediaUpload({
      filename: file.originalFilename,
      mimeType: sniffed,
      sizeBytes: file.sizeBytes,
      kind: "image",
      bytes: file.buffer,
    });
    if (issues.length > 0) {
      throw new AppError({
        statusCode: 422,
        code: issues[0]!.code,
        message: issues[0]!.message,
      });
    }
    const stored = await this.catalogMedia.put({
      productId,
      originalFilename: file.originalFilename,
      bytes: file.buffer,
    });
    return this.addProductImage(context, productId, {
      url: stored.publicUrl,
      altText: null,
      storageKey: stored.filename,
      mimeType: sniffed,
      fileSize: file.sizeBytes,
    });
  }

  async addProductImage(
    context: AuthContext,
    productId: string,
    input: CreateOpsProductImageInput,
  ) {
    requireOrg(context);
    await this.requireProduct(productId);
    const aggregate = await this.database.productImage.aggregate({
      where: { productId },
      _max: { position: true },
    });
    const position = input.position ?? (aggregate._max.position ?? -1) + 1;
    if (position === 0) {
      await this.database.productImage.updateMany(
        mediaWriteData({
          where: { productId, isPrimary: true },
          data: { isPrimary: false },
        }),
      );
    }
    const row = await this.database.productImage.create({
      data: mediaWriteData({
        productId,
        url: input.url,
        altText: input.altText ?? null,
        caption: input.caption ?? null,
        storageKey: input.storageKey ?? null,
        mimeType: input.mimeType ?? null,
        fileSize: input.fileSize ?? null,
        position,
        isPrimary: position === 0,
      }),
    });
    return {
      id: row.id,
      url: row.url,
      altText: row.altText,
      position: row.position,
    };
  }

  async updateProductImage(
    context: AuthContext,
    productId: string,
    imageId: string,
    input: UpdateOpsProductImageInput,
  ) {
    requireOrg(context);
    await this.requireProductImage(productId, imageId);
    if (input.position !== undefined) {
      await this.reorderProductMediaPositions({
        productId,
        mediaId: imageId,
        targetPosition: input.position,
        kind: "image",
      });
    }
    const row = await this.database.productImage.update({
      where: { id: imageId },
      data: {
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.altText !== undefined ? { altText: input.altText } : {}),
      },
    });
    return {
      id: row.id,
      url: row.url,
      altText: row.altText,
      position: row.position,
    };
  }

  async deleteProductImage(
    context: AuthContext,
    productId: string,
    imageId: string,
  ) {
    requireOrg(context);
    const image = await this.requireProductImage(productId, imageId);
    await this.database.productImage.delete({ where: { id: imageId } });
    await this.compactProductImagePositions(productId);
    const stored = parseStoredCatalogMediaUrl(image.url);
    if (!stored || stored.productId !== productId) return;
    await this.catalogMedia.remove({
      productId,
      filename: stored.filename,
    });
  }

  async setProductImagePrimary(
    context: AuthContext,
    productId: string,
    imageId: string,
  ) {
    requireOrg(context);
    await this.requireProductImage(productId, imageId);
    const images = await this.database.productImage.findMany({
      where: { productId },
      orderBy: { position: "asc" },
    });
    if (images.length === 0) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Product image not found.",
      });
    }
    const target = images.find((row) => row.id === imageId);
    if (!target) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Product image not found.",
      });
    }
    if (target.position === 0 && images[0]?.id === imageId) {
      if (!(target as { isPrimary?: boolean }).isPrimary) {
        await this.database.productImage.update({
          where: { id: imageId },
          data: mediaWriteData({ isPrimary: true }),
        });
      }
      return {
        id: target.id,
        url: target.url,
        altText: target.altText,
        position: target.position,
      };
    }
    const reordered = [
      target,
      ...images.filter((row) => row.id !== imageId),
    ];
    await this.database.$transaction(async (tx) => {
      for (const [index, row] of reordered.entries()) {
        await tx.productImage.update({
          where: { id: row.id },
          data: mediaWriteData({ position: index + 1000, isPrimary: false }),
        });
      }
      for (const [index, row] of reordered.entries()) {
        await tx.productImage.update({
          where: { id: row.id },
          data: mediaWriteData({ position: index, isPrimary: index === 0 }),
        });
      }
    });
    const primary = await this.database.productImage.findUniqueOrThrow({
      where: { id: imageId },
    });
    return {
      id: primary.id,
      url: primary.url,
      altText: primary.altText,
      position: primary.position,
    };
  }

  async uploadProductVideo(
    context: AuthContext,
    productId: string,
    file: UploadedFileInput,
  ) {
    requireOrg(context);
    await this.requireProduct(productId);
    const sniffed = sniffCatalogMediaMime(file.buffer) ?? file.mimeType;
    const issues = validateCatalogMediaUpload({
      filename: file.originalFilename,
      mimeType: sniffed,
      sizeBytes: file.sizeBytes,
      kind: "video",
      bytes: file.buffer,
    });
    if (issues.length > 0) {
      throw new AppError({
        statusCode: 422,
        code: issues[0]!.code,
        message: issues[0]!.message,
      });
    }
    const stored = await this.catalogMedia.put({
      productId,
      originalFilename: file.originalFilename,
      bytes: file.buffer,
    });
    return this.addProductVideo(context, productId, { url: stored.publicUrl });
  }

  async addProductVideo(
    context: AuthContext,
    productId: string,
    input: CreateOpsProductVideoInput,
  ) {
    requireOrg(context);
    await this.requireProduct(productId);
    const aggregate = await this.database.productVideo.aggregate({
      where: { productId },
      _max: { position: true },
    });
    const position = input.position ?? (aggregate._max.position ?? -1) + 1;
    const row = await this.database.productVideo.create({
      data: {
        productId,
        url: input.url,
        title: input.title ?? null,
        caption: input.caption ?? null,
        position,
      },
    });
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      caption: row.caption,
      position: row.position,
    };
  }

  async updateProductVideo(
    context: AuthContext,
    productId: string,
    videoId: string,
    input: UpdateOpsProductVideoInput,
  ) {
    requireOrg(context);
    await this.requireProductVideo(productId, videoId);
    if (input.position !== undefined) {
      await this.reorderProductMediaPositions({
        productId,
        mediaId: videoId,
        targetPosition: input.position,
        kind: "video",
      });
    }
    const row = await this.database.productVideo.update({
      where: { id: videoId },
      data: {
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.caption !== undefined ? { caption: input.caption } : {}),
      },
    });
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      caption: row.caption,
      position: row.position,
    };
  }

  /**
   * Collision-safe reorder for unique (productId, position) indexes.
   * Moves media to targetPosition via a two-phase temporary offset.
   */
  private async reorderProductMediaPositions(input: {
    productId: string;
    mediaId: string;
    targetPosition: number;
    kind: "image" | "video";
  }) {
    const rows =
      input.kind === "image"
        ? await this.database.productImage.findMany({
            where: { productId: input.productId },
            orderBy: { position: "asc" },
          })
        : await this.database.productVideo.findMany({
            where: { productId: input.productId },
            orderBy: { position: "asc" },
          });
    if (rows.length === 0) return;
    const fromIndex = rows.findIndex((row) => row.id === input.mediaId);
    if (fromIndex < 0) return;
    const toIndex = Math.max(0, Math.min(input.targetPosition, rows.length - 1));
    if (fromIndex === toIndex) return;
    const next = [...rows];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return;
    next.splice(toIndex, 0, moved);
    await this.database.$transaction(async (tx) => {
      for (const [index, row] of next.entries()) {
        if (input.kind === "image") {
          await tx.productImage.update({
            where: { id: row.id },
            data: { position: index + 1000 },
          });
        } else {
          await tx.productVideo.update({
            where: { id: row.id },
            data: { position: index + 1000 },
          });
        }
      }
      for (const [index, row] of next.entries()) {
        if (input.kind === "image") {
          await tx.productImage.update({
            where: { id: row.id },
            data: { position: index },
          });
        } else {
          await tx.productVideo.update({
            where: { id: row.id },
            data: { position: index },
          });
        }
      }
    });
  }

  async deleteProductVideo(
    context: AuthContext,
    productId: string,
    videoId: string,
  ) {
    requireOrg(context);
    const video = await this.requireProductVideo(productId, videoId);
    await this.database.productVideo.delete({ where: { id: videoId } });
    const stored = parseStoredCatalogMediaUrl(video.url);
    if (!stored || stored.productId !== productId) return;
    await this.catalogMedia.remove({
      productId,
      filename: stored.filename,
    });
  }

  async listBrands(context: AuthContext, query: OpsListQuery) {
    requireOrg(context);
    const where = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { slug: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {};
    const total = await this.database.brand.count({ where });
    const rows = await this.database.brand.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdAt: row.createdAt.toISOString(),
      })),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  async createBrand(context: AuthContext, input: CreateOpsBrandInput) {
    requireOrg(context);
    const slug = input.slug?.toLowerCase() ?? deriveSlug(input.name, `brand-${Date.now()}`);
    const row = await this.database.brand.create({
      data: { name: input.name, slug },
    });
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listManufacturers(context: AuthContext, query: OpsListQuery) {
    requireOrg(context);
    const where = query.q
      ? {
          legalName: { contains: query.q, mode: "insensitive" as const },
        }
      : {};
    const total = await this.database.manufacturer.count({ where });
    const rows = await this.database.manufacturer.findMany({
      where,
      orderBy: { legalName: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        legalName: row.legalName,
        countryCode: row.countryCode,
        createdAt: row.createdAt.toISOString(),
      })),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  async createManufacturer(
    context: AuthContext,
    input: CreateOpsManufacturerInput,
  ) {
    requireOrg(context);
    const row = await this.database.manufacturer.create({
      data: {
        legalName: input.legalName,
        countryCode: input.countryCode ?? null,
      },
    });
    return {
      id: row.id,
      legalName: row.legalName,
      countryCode: row.countryCode,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async requireProduct(id: string) {
    const existing = await this.database.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Product not found.",
      });
    }
  }

  private async compactProductImagePositions(productId: string) {
    const images = await this.database.productImage.findMany({
      where: { productId },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    if (images.length === 0) return;
    await this.database.$transaction(async (tx) => {
      for (const [index, row] of images.entries()) {
        await tx.productImage.update({
          where: { id: row.id },
          data: mediaWriteData({ position: index + 1000, isPrimary: false }),
        });
      }
      for (const [index, row] of images.entries()) {
        await tx.productImage.update({
          where: { id: row.id },
          data: mediaWriteData({ position: index, isPrimary: index === 0 }),
        });
      }
    });
  }

  private async requireProductImage(productId: string, imageId: string) {
    const existing = await this.database.productImage.findFirst({
      where: { id: imageId, productId },
      select: { id: true, url: true },
    });
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Product image not found.",
      });
    }
    return existing;
  }

  private async requireProductVideo(productId: string, videoId: string) {
    const existing = await this.database.productVideo.findFirst({
      where: { id: videoId, productId },
      select: { id: true, url: true },
    });
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Product video not found.",
      });
    }
    return existing;
  }

  async createCategory(context: AuthContext, input: CreateOpsCategoryInput) {
    requireOrg(context);
    const derived =
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 180) || `category-${Date.now()}`;
    let slug = (input.slug?.toLowerCase() ?? derived) || derived;
    let suffix = 2;
    while (await this.database.productCategory.findUnique({ where: { slug } })) {
      slug = `${derived}-${suffix}`.slice(0, 200);
      suffix += 1;
    }
    const row = withCategoryMedia(
      await this.database.productCategory.create({
        data: categoryWriteData({
          name: input.name,
          slug,
          status: input.status ?? "draft",
          parentId: input.parentId ?? null,
          description: input.description ?? null,
        }),
      }),
    );
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      parentId: row.parentId,
      description: row.description,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async uploadCategoryImage(
    context: AuthContext,
    categoryId: string,
    file: UploadedFileInput,
  ) {
    requireOrg(context);
    const existing = withCategoryMedia(
      await this.database.productCategory.findUnique({
        where: { id: categoryId },
      }),
    );
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Category not found.",
      });
    }
    const issues = validateCatalogMediaUpload({
      filename: file.originalFilename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      kind: "image",
    });
    if (issues.length > 0) {
      throw new AppError({
        statusCode: 422,
        code: issues[0]!.code,
        message: issues[0]!.message,
      });
    }
    const stored = await this.catalogMedia.put({
      productId: categoryId,
      originalFilename: file.originalFilename,
      bytes: file.buffer,
    });
    const row = withCategoryMedia(
      await this.database.productCategory.update({
        where: { id: categoryId },
        data: categoryWriteData({
          imageUrl: stored.publicUrl,
          imageAlt:
            existing.imageAlt?.trim() ||
            `${existing.name} procurement equipment`,
          imageStorageKey: stored.filename,
          imageMimeType: file.mimeType,
          imageBytes: file.sizeBytes,
        }),
      }),
    );
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      parentId: row.parentId,
      description: row.description,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async updateCategory(
    context: AuthContext,
    id: string,
    input: UpdateOpsCategoryInput,
  ) {
    requireOrg(context);
    const existing = await this.database.productCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Category not found.",
      });
    }
    const row = withCategoryMedia(
      await this.database.productCategory.update({
        where: { id },
        data: categoryWriteData({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.slug !== undefined ? { slug: input.slug.toLowerCase() } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
          ...(input.clearImage
            ? {
                imageUrl: null,
                imageAlt: null,
                imageStorageKey: null,
                imageMimeType: null,
                imageBytes: null,
              }
            : {}),
        }),
      }),
    );
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      parentId: row.parentId,
      description: row.description,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listPurchaseOrders(context: AuthContext, query: OpsListQuery) {
    const organizationId = requireOrg(context);
    const where = {
      organizationId,
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.q
        ? { publicCode: { contains: query.q, mode: "insensitive" as const } }
        : {}),
    };
    const total = await this.database.purchaseOrder.count({ where });
    const rows = await this.database.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        supplier: { select: { id: true, legalName: true } },
        items: true,
      },
    });
    return {
      data: rows.map((row) => ({
        id: row.id,
        publicCode: row.publicCode,
        status: row.status,
        currencyCode: row.currencyCode,
        totalAmount: row.totalAmount.toString(),
        procurementRequestId: row.procurementRequestId,
        quotationId: row.quotationId,
        supplierId: row.supplierId,
        supplierName: row.supplier?.legalName ?? null,
        rowVersion: row.rowVersion,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        items: row.items.map((item) => {
          const quantity = Number(item.quantity);
          const unitAmount = Number(item.unitAmount);
          return {
            id: item.id,
            description: item.description,
            quantity: item.quantity.toString(),
            unitAmount: item.unitAmount.toString(),
            lineAmount: (quantity * unitAmount).toFixed(2),
          };
        }),
      })),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  async generateReport(context: AuthContext, input: OpsReportInput) {
    const organizationId = requireOrg(context);
    const dateFilter =
      input.from || input.to
        ? {
            createdAt: {
              ...(input.from ? { gte: input.from } : {}),
              ...(input.to ? { lte: input.to } : {}),
            },
          }
        : {};

    let rows: Record<string, string | number | null>[] = [];
    switch (input.domain) {
      case "requests": {
        const data = await this.database.procurementRequest.findMany({
          where: { organizationId, ...dateFilter },
          orderBy: { createdAt: "desc" },
          take: 5_000,
        });
        rows = data.map((r) => ({
          id: r.id,
          publicCode: r.publicCode,
          title: r.title,
          status: r.status,
          lob: r.lob,
          priority: r.priority,
          createdAt: r.createdAt.toISOString(),
        }));
        break;
      }
      case "quotations": {
        const data = await this.database.quotation.findMany({
          where: { organizationId, ...dateFilter },
          orderBy: { createdAt: "desc" },
          take: 5_000,
        });
        rows = data.map((r) => ({
          id: r.id,
          publicCode: r.publicCode,
          status: r.status,
          totalAmount: r.totalAmount.toString(),
          createdAt: r.createdAt.toISOString(),
        }));
        break;
      }
      case "purchase-orders": {
        const data = await this.database.purchaseOrder.findMany({
          where: { organizationId, ...dateFilter },
          orderBy: { createdAt: "desc" },
          take: 5_000,
        });
        rows = data.map((r) => ({
          id: r.id,
          publicCode: r.publicCode,
          status: r.status,
          totalAmount: r.totalAmount.toString(),
          createdAt: r.createdAt.toISOString(),
        }));
        break;
      }
      case "invoices": {
        const data = await this.database.invoice.findMany({
          where: { organizationId, ...dateFilter },
          orderBy: { createdAt: "desc" },
          take: 5_000,
        });
        rows = data.map((r) => ({
          id: r.id,
          invoiceNumber: r.invoiceNumber,
          status: r.status,
          totalAmount: r.totalAmount.toString(),
          createdAt: r.createdAt.toISOString(),
        }));
        break;
      }
      case "payments": {
        const data = await this.database.payment.findMany({
          where: { organizationId, ...dateFilter },
          orderBy: { createdAt: "desc" },
          take: 5_000,
        });
        rows = data.map((r) => ({
          id: r.id,
          status: r.status,
          amount: r.amount.toString(),
          method: r.method,
          createdAt: r.createdAt.toISOString(),
        }));
        break;
      }
      case "shipments": {
        const data = await this.database.shipment.findMany({
          where: { organizationId, ...dateFilter },
          orderBy: { createdAt: "desc" },
          take: 5_000,
        });
        rows = data.map((r) => ({
          id: r.id,
          publicCode: r.publicCode,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }));
        break;
      }
      case "audit": {
        const data = await this.database.auditEvent.findMany({
          where: { organizationId, ...dateFilter },
          orderBy: { createdAt: "desc" },
          take: 5_000,
        });
        rows = data.map((r) => ({
          id: r.id,
          action: r.action,
          resourceType: r.resourceType,
          resourceId: r.resourceId,
          actorId: r.actorId,
          createdAt: r.createdAt.toISOString(),
        }));
        break;
      }
      case "suppliers": {
        const data = await this.database.supplier.findMany({
          orderBy: { legalName: "asc" },
          take: 5_000,
        });
        rows = data.map((r) => ({
          id: r.id,
          name: r.legalName,
          status: r.status,
          countryCode: r.countryCode,
        }));
        break;
      }
      case "products": {
        const data = await this.database.product.findMany({
          orderBy: { name: "asc" },
          take: 5_000,
        });
        rows = data.map((r) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          status: r.status,
        }));
        break;
      }
      case "users": {
        const data = await this.database.organizationMembership.findMany({
          where: { organizationId },
          include: { user: true },
          take: 5_000,
        });
        rows = data.map((r) => ({
          membershipId: r.id,
          userId: r.userId,
          email: r.user.email,
          status: r.status,
          firstName: r.user.firstName,
          lastName: r.user.lastName,
        }));
        break;
      }
      default:
        rows = [];
    }

    await this.database.auditEvent.create({
      data: {
        organizationId,
        actorId: context.userId,
        action: "ops.report.generate",
        resourceType: "report",
        resourceId: organizationId,
        metadata: {
          domain: input.domain,
          format: input.format,
          rowCount: rows.length,
          before: null,
          after: { domain: input.domain, rowCount: rows.length },
        },
      },
    });

    return {
      domain: input.domain,
      format: input.format,
      generatedAt: new Date().toISOString(),
      rowCount: rows.length,
      rows,
    };
  }
}
