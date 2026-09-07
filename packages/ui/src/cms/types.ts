/** Enterprise CMS contracts - docs/22 lifecycle; hosts inject API later. */

export const CMS_CONTENT_TYPES = [
  "homepage_hero",
  "homepage_section",
  "service",
  "industry",
  "product_category",
  "faq",
  "testimonial",
  "announcement",
  "news",
  "career_post",
  "wedding_banner",
  "global_notice",
  "seo_metadata",
  "footer",
] as const;
export type CmsContentType = (typeof CMS_CONTENT_TYPES)[number];

export const CMS_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "archived",
  "rejected",
  "superseded",
] as const;
export type CmsStatus = (typeof CMS_STATUSES)[number];

export const CMS_COMMANDS = [
  "save_draft",
  "submit_review",
  "approve",
  "reject",
  "schedule",
  "publish",
  "unpublish",
  "archive",
  "restore",
  "rollback",
  "preview",
] as const;
export type CmsCommand = (typeof CMS_COMMANDS)[number];

export type CmsLocale = string;

export type CmsSeoFields = {
  title?: string | undefined;
  description?: string | undefined;
  canonicalUrl?: string | undefined;
  robots?: string | undefined;
  socialImageHref?: string | undefined;
  structuredDataType?: string | undefined;
};

export type CmsMediaAsset = {
  id: string;
  name: string;
  mimeType: string;
  href: string;
  altText?: string | undefined;
  width?: number | undefined;
  height?: number | undefined;
  rights?: string | undefined;
  scanStatus?: "clean" | "pending" | "blocked" | string | undefined;
  uploadedAt: string;
  usageCount?: number | undefined;
};

export type CmsVersion = {
  id: string;
  versionNumber: number;
  status: CmsStatus | string;
  summary?: string | undefined;
  authorName?: string | undefined;
  createdAt: string;
  current?: boolean | undefined;
  publishedAt?: string | null | undefined;
};

export type CmsContentRecord = {
  id: string;
  type: CmsContentType | string;
  slug: string;
  title: string;
  summary?: string | undefined;
  body?: string | undefined;
  status: CmsStatus | string;
  locale: CmsLocale;
  rowVersion: number;
  versionNumber: number;
  authorName?: string | undefined;
  updatedAt: string;
  publishedAt?: string | null | undefined;
  scheduledFor?: string | null | undefined;
  previewToken?: string | null | undefined;
  seo: CmsSeoFields;
  mediaIds?: string[] | undefined;
  versions: CmsVersion[];
  fields?: Record<string, unknown> | undefined;
};

export type CmsDirectoryFilters = {
  query: string;
  type: "all" | string;
  status: "all" | string;
  locale: "all" | string;
  page: number;
  pageSize: number;
};

export type CmsSaveDraftInput = {
  title: string;
  summary?: string | undefined;
  body?: string | undefined;
  seo?: CmsSeoFields | undefined;
  fields?: Record<string, unknown> | undefined;
  mediaIds?: string[] | undefined;
};

export type CmsScheduleInput = {
  scheduledFor: string;
};

export type CmsCreateInput = {
  type: CmsContentType | string;
  title: string;
  slug: string;
  locale?: string | undefined;
  summary?: string | undefined;
};

export const emptyCmsFilters = (): CmsDirectoryFilters => ({
  query: "",
  type: "all",
  status: "all",
  locale: "all",
  page: 1,
  pageSize: 8,
});

export function cmsContentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    homepage_hero: "Homepage hero",
    homepage_section: "Homepage sections",
    service: "Services",
    industry: "Industries",
    product_category: "Product categories",
    faq: "FAQs",
    testimonial: "Testimonials",
    announcement: "Announcements",
    news: "News",
    career_post: "Career posts",
    wedding_banner: "Wedding banner",
    global_notice: "Global notices",
    seo_metadata: "SEO metadata",
    footer: "Footer",
  };
  return labels[type] ?? type.replaceAll("_", " ");
}

export function cmsStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    in_review: "In review",
    approved: "Approved",
    scheduled: "Scheduled",
    published: "Published",
    archived: "Archived",
    rejected: "Rejected",
    superseded: "Superseded",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function cmsCommandLabel(command: string): string {
  const labels: Record<string, string> = {
    save_draft: "Save draft",
    submit_review: "Submit for review",
    approve: "Approve",
    reject: "Reject",
    schedule: "Schedule",
    publish: "Publish",
    unpublish: "Unpublish",
    archive: "Archive",
    restore: "Restore",
    rollback: "Rollback",
    preview: "Open preview",
  };
  return labels[command] ?? command.replaceAll("_", " ");
}

/** UI affordances mirroring docs/22 lifecycle. */
export function availableCmsCommands(status: string): CmsCommand[] {
  switch (status) {
    case "draft":
      return ["save_draft", "submit_review", "preview", "archive"];
    case "in_review":
      return ["approve", "reject", "preview"];
    case "approved":
      return ["schedule", "publish", "preview"];
    case "scheduled":
      return ["publish", "unpublish", "preview"];
    case "published":
      return ["save_draft", "unpublish", "archive", "preview", "rollback"];
    case "archived":
      return ["restore"];
    case "rejected":
      return ["save_draft", "archive"];
    default:
      return ["preview"];
  }
}

export function filterCmsContent(
  rows: CmsContentRecord[],
  filters: CmsDirectoryFilters,
): CmsContentRecord[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.type !== "all" && row.type !== filters.type) return false;
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.locale !== "all" && row.locale !== filters.locale) return false;
    if (!q) return true;
    const hay = [
      row.title,
      row.slug,
      row.summary ?? "",
      cmsContentTypeLabel(String(row.type)),
      row.authorName ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paginateCmsRows<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; page: number; pageCount: number } {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageCount,
  };
}

export function filterCmsMedia(
  assets: CmsMediaAsset[],
  query: string,
): CmsMediaAsset[] {
  const q = query.trim().toLowerCase();
  if (!q) return assets;
  return assets.filter((a) =>
    [a.name, a.mimeType, a.altText ?? "", a.rights ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}
