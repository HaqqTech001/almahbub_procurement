import type {
  ActivityLogEntry,
  IdentityUser,
  MembershipRecord,
  OrganizationInvitation,
  OrganizationSummary,
  PermissionSummary,
  RoleSummary,
  SessionDevice,
  UserPreferences,
} from "@hamd/ui/identity";
import {
  identityActivityFixture,
  identityCurrentUserFixture,
  identityPreferencesFixture,
} from "@hamd/ui/identity";
import type { SupplierRecord } from "@hamd/ui/suppliers";
import type { PurchaseOrderRecord } from "@hamd/ui/purchase-orders";
import type { AuditEvent, AuditRetentionPolicy } from "@hamd/ui/audit";

import { getAccessToken } from "../auth/session/token-store.js";
import { OpsApiError, opsFetch, opsFetchEnvelope, requireOpsToken } from "../lib/ops-fetch.js";

export type OpsIdentityPayload = {
  currentUser: IdentityUser;
  organizations: OrganizationSummary[];
  activeOrganizationId: string;
  members: MembershipRecord[];
  invitations: OrganizationInvitation[];
  roles: RoleSummary[];
  permissions: PermissionSummary[];
  sessions: SessionDevice[];
  activity: ActivityLogEntry[];
  preferences: UserPreferences;
};

export type OpsProductImage = {
  id: string;
  url: string;
  altText: string | null;
  position: number;
};

export type OpsProductVideo = {
  id: string;
  url: string;
  title: string | null;
  caption: string | null;
  position: number;
};

export type OpsProductRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  categoryId?: string | null;
  categoryName?: string | null;
  description?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  manufacturerId?: string | null;
  manufacturerName?: string | null;
  manufacturerCountry?: string | null;
  images?: OpsProductImage[];
  videos?: OpsProductVideo[];
  createdAt?: string;
  updatedAt?: string;
};

export type OpsCategoryRow = {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  parentId?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type OpsBrandRow = {
  id: string;
  name: string;
  slug: string;
};

export type OpsManufacturerRow = {
  id: string;
  legalName: string;
  countryCode?: string | null;
};

export type OpsProductInput = {
  name: string;
  slug?: string;
  status?: "draft" | "published" | "archived";
  categoryId?: string | null;
  description?: string | null;
  brandId?: string | null;
  manufacturerId?: string | null;
};

export type OpsDashboardKpi = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  href?: string;
};

export type OpsAttentionItem = {
  id: string;
  label: string;
  count: number;
  href: string;
};

export type OpsPipelineStage = {
  id: string;
  label: string;
  count: number;
  href: string;
};

export type OpsSeriesPoint = { date: string; count: number };

export type OpsDashboardData = {
  generatedAt: string;
  kpis: OpsDashboardKpi[];
  attention?: OpsAttentionItem[];
  requestPipeline?: OpsPipelineStage[];
  catalogue?: { published: number; draft: number; archived: number };
  quotationBreakdown?: Record<string, number>;
  shipmentBreakdown?: Record<string, number>;
  requestSeries?: {
    "7d": OpsSeriesPoint[];
    "30d": OpsSeriesPoint[];
    "90d": OpsSeriesPoint[];
  };
  recentProducts: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    categoryName: string | null;
    updatedAt: string;
    href: string;
  }>;
  recentRequests: Array<{
    id: string;
    publicCode: string;
    title: string;
    status: string;
    organizationName?: string | null;
    requesterName?: string | null;
    createdAt: string;
    href: string;
  }>;
  recentQuotations?: Array<{
    id: string;
    publicCode: string;
    status: string;
    updatedAt: string;
    href: string;
  }>;
  recentShipments?: Array<{
    id: string;
    publicCode: string;
    status: string;
    updatedAt: string;
    href: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    resourceType: string;
    resourceId: string;
    actorName: string;
    occurredAt: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
    permission?: string;
  }>;
};

export type OpsDirectoryMember = {
  id: string;
  userId: string;
  status: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  userStatus?: string;
  lastAuthenticatedAt?: string | null;
  emailVerifiedAt?: string | null;
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  requestCount?: number;
  hasOpsAccess?: boolean;
  roles: Array<{ id: string; key: string; name: string }>;
  createdAt: string;
};

export type OpsOrganizationRow = {
  id: string;
  name: string;
  legalName?: string;
  slug: string;
  status: string;
  countryCode?: string | null;
  memberCount?: number;
  requestCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type LiveIdentity = {
  organization: {
    id: string;
    name: string;
    legalName?: string;
    slug: string;
    status: string;
  };
  organizations?: OpsOrganizationRow[];
  page?: { page: number; pageSize: number; total: number; hasMore: boolean };
  members: OpsDirectoryMember[];
  invitations: Array<{
    id: string;
    email: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  }>;
  roles: Array<{
    id: string;
    key: string;
    name: string;
    permissions: string[];
  }>;
  permissions: Array<{ id: string; key: string; description?: string | null }>;
  sessions: Array<{
    id: string;
    userId: string;
    userEmail: string;
    createdAt: string;
    expiresAt: string;
    ipHash?: string | null;
    userAgent?: string | null;
  }>;
};

async function tryOpsGet<T>(
  accessToken: string,
  path: string,
): Promise<T | null> {
  try {
    return await opsFetch<T>(path, { method: "GET", accessToken });
  } catch (err) {
    if (
      err instanceof OpsApiError &&
      (err.status === 404 || err.status === 501)
    ) {
      return null;
    }
    throw err;
  }
}

function mapIdentity(live: LiveIdentity): OpsIdentityPayload {
  const org: OrganizationSummary = {
    id: live.organization.id,
    legalName: live.organization.legalName ?? live.organization.name,
    displayName: live.organization.name,
    slug: live.organization.slug,
    status: live.organization.status,
    countryCode: null,
    roleLabel: "Member",
  };

  const roleIndex = new Map(
    live.roles.map((role) => [
      role.id,
      {
        id: role.id,
        key: role.key,
        name: role.name,
        description: null as string | null,
        scope: "organization",
        permissionKeys: role.permissions,
      } satisfies RoleSummary,
    ]),
  );

  const members: MembershipRecord[] = live.members.map((member) => ({
    id: member.id,
    userId: member.userId,
    organizationId: live.organization.id,
    status: member.status,
    joinedAt: member.createdAt,
    user: {
      id: member.userId,
      email: member.email,
      status: "active",
      firstName: member.firstName,
      lastName: member.lastName,
      displayName: [member.firstName, member.lastName].filter(Boolean).join(" "),
      locale: "en",
      timeZone: "Africa/Lagos",
      avatarUrl: null,
      emailVerifiedAt: null,
      lastAuthenticatedAt: null,
      createdAt: member.createdAt,
    },
    roles: member.roles.map(
      (role) =>
        roleIndex.get(role.id) ?? {
          id: role.id,
          key: role.key,
          name: role.name,
          description: null,
          scope: "organization",
          permissionKeys: [],
        },
    ),
  }));

  const invitations: OrganizationInvitation[] = live.invitations.map(
    (invite) => ({
      id: invite.id,
      organizationId: live.organization.id,
      email: invite.email,
      status: invite.status,
      roleKeys: [],
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    }),
  );

  const roles: RoleSummary[] = live.roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    description: null,
    scope: "organization",
    permissionKeys: role.permissions,
  }));

  const permissions: PermissionSummary[] = live.permissions.map((p) => {
    const [resource = "ops", action = "read"] = p.key.split(":");
    return {
      key: p.key,
      resource,
      action,
      description: p.description ?? undefined,
    };
  });

  const sessions: SessionDevice[] = live.sessions.map((session) => ({
    id: session.id,
    status: "active",
    deviceName: session.userEmail,
    platform: "web",
    userAgent: session.userAgent ?? undefined,
    ipLabel: session.ipHash ?? undefined,
    lastUsedAt: session.createdAt,
    createdAt: session.createdAt,
    current: false,
  }));

  return {
    currentUser: identityCurrentUserFixture,
    organizations: [org],
    activeOrganizationId: org.id,
    members,
    invitations,
    roles,
    permissions,
    sessions,
    activity: identityActivityFixture,
    preferences: identityPreferencesFixture,
  };
}

function mapSupplier(row: {
  id: string;
  name?: string;
  legalName?: string;
  status: string;
  countryCode?: string | null;
  createdAt: string;
  updatedAt: string;
}): SupplierRecord {
  const legalName = row.legalName ?? row.name ?? "Supplier";
  return {
    id: row.id,
    legalName,
    status: row.status,
    countryCode: row.countryCode ?? null,
    countriesServed: row.countryCode ? [row.countryCode] : [],
    verification: "unverified",
    riskTier: "medium",
    riskScore: 50,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    contacts: [],
    locations: [],
    certifications: [],
    documents: [],
    ratings: {
      overall: 0,
      quality: 0,
      delivery: 0,
      communication: 0,
      reviewCount: 0,
    },
    leadTime: { minDays: 7, maxDays: 30, typicalDays: 14 },
    performance: [],
    products: [],
    communications: [],
  };
}

function mapPurchaseOrder(row: {
  id: string;
  publicCode: string;
  status: string;
  currencyCode: string;
  totalAmount: string;
  procurementRequestId: string;
  quotationId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  items?: Array<{
    id: string;
    description: string;
    quantity: string;
    unitAmount: string;
    lineAmount?: string;
  }>;
}): PurchaseOrderRecord {
  return {
    id: row.id,
    publicCode: row.publicCode,
    status: row.status,
    currencyCode: row.currencyCode,
    totalAmount: Number(row.totalAmount),
    procurementRequestId: row.procurementRequestId,
    quotationId: row.quotationId ?? null,
    supplierId: row.supplierId ?? null,
    supplierName: row.supplierName ?? null,
    rowVersion: row.rowVersion,
    versionNumber: 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    items: (row.items ?? []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitAmount: Number(item.unitAmount),
      lineAmount: Number(
        item.lineAmount ?? Number(item.quantity) * Number(item.unitAmount),
      ),
    })),
    documents: [],
    attachments: [],
    history: [],
    revisions: [],
    deliveries: [],
    supplierAcceptance: "pending",
  };
}

export async function fetchOpsDashboard(
  accessToken: string,
): Promise<OpsDashboardData> {
  const live = await opsFetch<OpsDashboardData>("/ops/dashboard", {
    method: "GET",
    accessToken,
  });
  return {
    generatedAt: live.generatedAt,
    kpis: live.kpis ?? [],
    attention: live.attention ?? [],
    requestPipeline: live.requestPipeline ?? [],
    catalogue: live.catalogue,
    quotationBreakdown: live.quotationBreakdown ?? {},
    shipmentBreakdown: live.shipmentBreakdown ?? {},
    requestSeries: live.requestSeries,
    recentProducts: live.recentProducts ?? [],
    recentRequests: live.recentRequests ?? [],
    recentQuotations: live.recentQuotations ?? [],
    recentShipments: live.recentShipments ?? [],
    recentActivity: live.recentActivity ?? [],
    quickActions: live.quickActions ?? [],
  };
}

export async function fetchOpsDirectory(
  accessToken: string,
  query: {
    q?: string;
    page?: number;
    pageSize?: number;
    status?: string;
    userStatus?: string;
    organizationId?: string;
    userId?: string;
  } = {},
): Promise<{
  members: OpsDirectoryMember[];
  organizations: OpsOrganizationRow[];
  page: { page: number; pageSize: number; total: number; hasMore: boolean };
}> {
  const live = await opsFetch<LiveIdentity>("/ops/identity", {
    method: "GET",
    accessToken,
    query: {
      q: query.q,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 25,
      status: query.status,
      userStatus: query.userStatus,
      organizationId: query.organizationId,
      userId: query.userId,
    },
  });
  return {
    members: live.members ?? [],
    organizations: live.organizations ?? [],
    page: live.page ?? {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 25,
      total: live.members?.length ?? 0,
      hasMore: false,
    },
  };
}

export async function patchUserAccountStatus(
  accessToken: string,
  userId: string,
  command: "suspend" | "activate" | "deactivate",
  reason?: string,
): Promise<OpsDirectoryMember> {
  return opsFetch<OpsDirectoryMember>(`/ops/identity/users/${userId}/status`, {
    method: "PATCH",
    accessToken,
    body: { command, ...(reason ? { reason } : {}) },
  });
}

export async function patchUserOpsAccess(
  accessToken: string,
  userId: string,
  command: "grant" | "revoke",
): Promise<OpsDirectoryMember> {
  return opsFetch<OpsDirectoryMember>(
    `/ops/identity/users/${userId}/ops-access`,
    {
      method: "PATCH",
      accessToken,
      body: { command },
    },
  );
}

export async function fetchOpsIdentity(
  accessToken: string,
): Promise<OpsIdentityPayload | null> {
  const live = await tryOpsGet<LiveIdentity>(accessToken, "/ops/identity");
  return live ? mapIdentity(live) : null;
}

export async function fetchOpsSuppliers(
  accessToken: string,
): Promise<SupplierRecord[] | null> {
  const rows = await tryOpsGet<
    Array<{
      id: string;
      name: string;
      status: string;
      countryCode?: string | null;
      createdAt: string;
      updatedAt: string;
    }>
  >(accessToken, "/ops/suppliers");
  return rows ? rows.map(mapSupplier) : null;
}

export async function fetchOpsProducts(
  accessToken: string,
  query: {
    q?: string;
    page?: number;
    pageSize?: number;
    status?: string;
    categoryId?: string;
    sort?: string;
  } = {},
): Promise<{
  data: OpsProductRow[];
  page: { page: number; pageSize: number; total: number; hasMore: boolean };
}> {
  const result = await opsFetchEnvelope<OpsProductRow[]>("/ops/products", {
    method: "GET",
    accessToken,
    query: {
      q: query.q,
      sort: query.sort ?? "recommended",
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 25,
      status: query.status,
      categoryId: query.categoryId,
    },
  });
  return {
    data: Array.isArray(result.data) ? result.data : [],
    page: result.page ?? {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 25,
      total: Array.isArray(result.data) ? result.data.length : 0,
      hasMore: false,
    },
  };
}

export async function fetchOpsProduct(
  accessToken: string,
  id: string,
): Promise<OpsProductRow> {
  return opsFetch<OpsProductRow>(`/ops/products/${id}`, {
    method: "GET",
    accessToken,
  });
}

export async function createOpsProduct(
  accessToken: string,
  body: OpsProductInput,
): Promise<OpsProductRow> {
  return opsFetch<OpsProductRow>("/ops/products", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function updateOpsProduct(
  accessToken: string,
  id: string,
  body: Partial<OpsProductInput>,
): Promise<OpsProductRow> {
  return opsFetch<OpsProductRow>(`/ops/products/${id}`, {
    method: "PATCH",
    accessToken,
    body,
  });
}

export async function addOpsProductImage(
  accessToken: string,
  productId: string,
  body: { url: string; altText?: string | null; position?: number },
): Promise<OpsProductImage> {
  return opsFetch<OpsProductImage>(`/ops/products/${productId}/images`, {
    method: "POST",
    accessToken,
    body,
  });
}

export async function uploadOpsProductImage(
  accessToken: string,
  productId: string,
  file: File,
  altText?: string | null,
): Promise<OpsProductImage> {
  const form = new FormData();
  form.append("files", file);
  if (altText?.trim()) form.append("altText", altText.trim());
  const image = await opsFetch<OpsProductImage>(
    `/ops/products/${productId}/images/upload`,
    {
      method: "POST",
      accessToken,
      form,
    },
  );
  if (altText?.trim()) {
    return updateOpsProductImage(accessToken, productId, image.id, {
      altText: altText.trim(),
    });
  }
  return image;
}

export async function updateOpsProductImage(
  accessToken: string,
  productId: string,
  imageId: string,
  body: { url?: string; altText?: string | null; position?: number },
): Promise<OpsProductImage> {
  return opsFetch<OpsProductImage>(
    `/ops/products/${productId}/images/${imageId}`,
    {
      method: "PATCH",
      accessToken,
      body,
    },
  );
}

export async function deleteOpsProductImage(
  accessToken: string,
  productId: string,
  imageId: string,
): Promise<void> {
  await opsFetch(`/ops/products/${productId}/images/${imageId}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function setOpsProductImagePrimary(
  accessToken: string,
  productId: string,
  imageId: string,
): Promise<OpsProductImage> {
  return opsFetch<OpsProductImage>(
    `/ops/products/${productId}/images/${imageId}/primary`,
    {
      method: "POST",
      accessToken,
    },
  );
}

export async function addOpsProductVideo(
  accessToken: string,
  productId: string,
  body: {
    url: string;
    title?: string | null;
    caption?: string | null;
    position?: number;
  },
): Promise<OpsProductVideo> {
  return opsFetch<OpsProductVideo>(`/ops/products/${productId}/videos`, {
    method: "POST",
    accessToken,
    body,
  });
}

export async function uploadOpsProductVideo(
  accessToken: string,
  productId: string,
  file: File,
  meta?: { title?: string | null; caption?: string | null },
): Promise<OpsProductVideo> {
  const form = new FormData();
  form.append("files", file);
  const video = await opsFetch<OpsProductVideo>(
    `/ops/products/${productId}/videos/upload`,
    {
      method: "POST",
      accessToken,
      form,
    },
  );
  if (meta?.title?.trim() || meta?.caption?.trim()) {
    return updateOpsProductVideo(accessToken, productId, video.id, {
      title: meta.title?.trim() || null,
      caption: meta.caption?.trim() || null,
    });
  }
  return video;
}

export async function updateOpsProductVideo(
  accessToken: string,
  productId: string,
  videoId: string,
  body: {
    url?: string;
    title?: string | null;
    caption?: string | null;
    position?: number;
  },
): Promise<OpsProductVideo> {
  return opsFetch<OpsProductVideo>(
    `/ops/products/${productId}/videos/${videoId}`,
    {
      method: "PATCH",
      accessToken,
      body,
    },
  );
}

export async function deleteOpsProductVideo(
  accessToken: string,
  productId: string,
  videoId: string,
): Promise<void> {
  await opsFetch(`/ops/products/${productId}/videos/${videoId}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function fetchOpsCategories(
  accessToken: string,
): Promise<OpsCategoryRow[]> {
  return opsFetch<OpsCategoryRow[]>("/ops/categories", {
    method: "GET",
    accessToken,
    query: { pageSize: 100 },
  });
}

export async function createOpsCategory(
  accessToken: string,
  body: { name: string; slug?: string; status?: "draft" | "published" | "archived"; description?: string },
): Promise<OpsCategoryRow> {
  return opsFetch<OpsCategoryRow>("/ops/categories", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function updateOpsCategory(
  accessToken: string,
  id: string,
  body: {
    name?: string;
    slug?: string;
    status?: "draft" | "published" | "archived";
    description?: string;
    clearImage?: boolean;
  },
): Promise<OpsCategoryRow> {
  return opsFetch<OpsCategoryRow>(`/ops/categories/${id}`, {
    method: "PATCH",
    accessToken,
    body,
  });
}

export async function uploadOpsCategoryImage(
  accessToken: string,
  categoryId: string,
  file: File,
): Promise<OpsCategoryRow> {
  const form = new FormData();
  form.append("files", file);
  return opsFetch<OpsCategoryRow>(`/ops/categories/${categoryId}/image/upload`, {
    method: "POST",
    accessToken,
    form,
  });
}

export async function fetchOpsBrands(
  accessToken: string,
): Promise<OpsBrandRow[]> {
  return opsFetch<OpsBrandRow[]>("/ops/brands", {
    method: "GET",
    accessToken,
    query: { pageSize: 100 },
  });
}

export async function createOpsBrand(
  accessToken: string,
  body: { name: string; slug?: string },
): Promise<OpsBrandRow> {
  return opsFetch<OpsBrandRow>("/ops/brands", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function fetchOpsManufacturers(
  accessToken: string,
): Promise<OpsManufacturerRow[]> {
  return opsFetch<OpsManufacturerRow[]>("/ops/manufacturers", {
    method: "GET",
    accessToken,
    query: { pageSize: 100 },
  });
}

export async function createOpsManufacturer(
  accessToken: string,
  body: { legalName: string; countryCode?: string | null },
): Promise<OpsManufacturerRow> {
  return opsFetch<OpsManufacturerRow>("/ops/manufacturers", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function fetchOpsPurchaseOrders(
  accessToken: string,
): Promise<PurchaseOrderRecord[] | null> {
  const rows = await tryOpsGet<Parameters<typeof mapPurchaseOrder>[0][]>(
    accessToken,
    "/ops/purchase-orders",
  );
  return rows ? rows.map(mapPurchaseOrder) : null;
}

export async function fetchOpsAuditEvents(
  accessToken: string,
): Promise<{ events: AuditEvent[]; retention?: AuditRetentionPolicy } | null> {
  const rows = await tryOpsGet<AuditEvent[]>(accessToken, "/ops/audit-events");
  if (!rows) return null;
  return { events: rows };
}

export async function generateOpsReport(
  accessToken: string,
  body: {
    domain: string;
    format: string;
    from?: string;
    to?: string;
  },
): Promise<{
  domain: string;
  format: string;
  generatedAt: string;
  rowCount: number;
  rows: Record<string, string | number | null>[];
} | null> {
  try {
    return await opsFetch("/ops/reports/export", {
      method: "POST",
      accessToken,
      body,
    });
  } catch (err) {
    if (
      err instanceof OpsApiError &&
      (err.status === 404 || err.status === 501)
    ) {
      try {
        return await opsFetch("/ops/reports", {
          method: "POST",
          accessToken,
          body,
        });
      } catch (inner) {
        if (
          inner instanceof OpsApiError &&
          (inner.status === 404 || inner.status === 501)
        ) {
          return null;
        }
        throw inner;
      }
    }
    throw err;
  }
}

/** Alias matching ops reports export contract. */
export const exportOpsReport = generateOpsReport;

export async function requireToken(
  ensureSession: () => Promise<string | null>,
): Promise<string> {
  return requireOpsToken(ensureSession, getAccessToken);
}

export { OpsApiError };
