/** Enterprise guidance contracts - authenticated apps only; hosts inject CMS/API. */

export const GUIDANCE_MODES = ["off", "guided", "training"] as const;
export type GuidanceMode = (typeof GUIDANCE_MODES)[number];

export const GUIDANCE_AUDIENCES = [
  "client_workspace",
  "operations_console",
  "supplier_portal",
  "mobile",
  "all_authenticated",
  /** Public marketing / visitor tours (not persisted in Prisma enum yet - string-safe). */
  "public_visitor",
] as const;
export type GuidanceAudience = (typeof GUIDANCE_AUDIENCES)[number];

export const GUIDANCE_TOUR_STATUSES = [
  "draft",
  "published",
  "archived",
  "scheduled",
] as const;
export type GuidanceTourStatus = (typeof GUIDANCE_TOUR_STATUSES)[number];

export const GUIDANCE_PROGRESS_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "skipped",
] as const;
export type GuidanceProgressStatus = (typeof GUIDANCE_PROGRESS_STATUSES)[number];

/**
 * Every authenticated functional surface. Public marketing pages are intentionally
 * absent - Home, About, Contact, Privacy, Terms never participate.
 */
export const GUIDANCE_PAGE_KEYS = [
  "dashboard",
  "catalog",
  "product_detail",
  "categories",
  "bookmarks",
  "compare",
  "procurement_requests",
  "request_wizard",
  "draft_requests",
  "quotations",
  "purchase_orders",
  "invoices",
  "payments",
  "shipments",
  "tracking",
  "notifications",
  "messages",
  "chat",
  "profile",
  "settings",
  "security",
  "organization",
  "suppliers",
  "analytics",
  "reports",
  "cms",
  "audit",
  "administration",
  "assistant",
  "email_center",
  "platform_config",
  "recommendations",
  "learning_center",
] as const;
export type GuidancePageKey = (typeof GUIDANCE_PAGE_KEYS)[number];

export type GuidancePlacement =
  | "auto"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center";

export type GuidanceTourStep = {
  id: string;
  stepKey: string;
  title: string;
  body: string;
  targetSelector?: string | undefined;
  placement?: GuidancePlacement | undefined;
  requireAction?: boolean | undefined;
  actionEvent?: string | undefined;
  actionLabel?: string | undefined;
  imageHref?: string | undefined;
  sortOrder: number;
};

export type GuidanceTour = {
  id: string;
  key: string;
  title: string;
  description?: string | undefined;
  audience: GuidanceAudience | string;
  pageKey: GuidancePageKey | string;
  status: GuidanceTourStatus | string;
  mandatory?: boolean | undefined;
  estimatedMinutes: number;
  locale: string;
  sortOrder: number;
  /**
   * Content version - bump when CMS updates steps so completed users re-onboard.
   * Maps conceptually to Prisma `rowVersion` / admin publish revisions.
   */
  version?: number | undefined;
  scheduledFor?: string | null | undefined;
  publishedAt?: string | null | undefined;
  steps: GuidanceTourStep[];
};

export type GuidanceTip = {
  id: string;
  key: string;
  featureKey: string;
  pageKey: GuidancePageKey | string;
  title: string;
  body: string;
  targetSelector?: string | undefined;
  locale: string;
  enabled: boolean;
};

export type GuidanceUserPreference = {
  mode: GuidanceMode;
  neverAutoStart: boolean;
  welcomeCompletedAt?: string | null | undefined;
  locale: string;
  /** Per-tour "Don't show again" suppressions (keys). */
  suppressedTourKeys?: string[] | undefined;
};

export type GuidanceUserProgress = {
  tourId: string;
  tourKey: string;
  status: GuidanceProgressStatus;
  currentStepKey?: string | null | undefined;
  completedSteps: number;
  totalSteps: number;
  /** Tour content version observed when progress was last written. */
  tourVersion?: number | null | undefined;
  /** Client pause marker (status stays in_progress until resume/finish/skip). */
  pausedAt?: string | null | undefined;
  startedAt?: string | null | undefined;
  completedAt?: string | null | undefined;
  skippedAt?: string | null | undefined;
  lastActiveAt: string;
};

export type GuidanceAnalyticsSummary = {
  totalUsers: number;
  welcomeCompleted: number;
  toursCompleted: number;
  toursSkipped: number;
  modeBreakdown: Record<GuidanceMode, number>;
  completionRate: number;
};

export type GuidancePageDescriptor = {
  pageKey: GuidancePageKey;
  label: string;
  application: GuidanceAudience;
  pathPattern: string;
  primaryActions: string[];
  tourKey: string;
  excludedFromPublic?: boolean | undefined;
};

export type UpdateGuidancePreferenceInput = {
  mode?: GuidanceMode | undefined;
  neverAutoStart?: boolean | undefined;
  welcomeCompleted?: boolean | undefined;
  locale?: string | undefined;
  suppressedTourKeys?: string[] | undefined;
};

export type UpsertGuidanceProgressInput = {
  tourId: string;
  status: GuidanceProgressStatus;
  currentStepKey?: string | null | undefined;
  completedSteps?: number | undefined;
  totalSteps?: number | undefined;
  tourVersion?: number | null | undefined;
  pausedAt?: string | null | undefined;
};

export type GuidanceTourDraftInput = {
  key: string;
  title: string;
  description?: string | undefined;
  audience: GuidanceAudience;
  pageKey: GuidancePageKey | string;
  mandatory?: boolean | undefined;
  estimatedMinutes?: number | undefined;
  locale?: string | undefined;
  sortOrder?: number | undefined;
  scheduledFor?: string | null | undefined;
  steps: Array<{
    stepKey: string;
    title: string;
    body: string;
    targetSelector?: string | undefined;
    placement?: GuidancePlacement | undefined;
    requireAction?: boolean | undefined;
    actionEvent?: string | undefined;
    actionLabel?: string | undefined;
    imageHref?: string | undefined;
    sortOrder?: number | undefined;
  }>;
};

export function guidanceModeLabel(mode: GuidanceMode): string {
  switch (mode) {
    case "off":
      return "Guide off";
    case "guided":
      return "Guided mode";
    case "training":
      return "Training mode";
  }
}

export function isGuidanceActive(mode: GuidanceMode): boolean {
  return mode !== "off";
}

export function completionPercent(
  progress: readonly GuidanceUserProgress[],
  tours: readonly GuidanceTour[],
): number {
  if (tours.length === 0) return 0;
  const completed = progress.filter((p) => p.status === "completed").length;
  return Math.round((completed / tours.length) * 100);
}

export function filterToursByQuery(
  tours: readonly GuidanceTour[],
  query: string,
): GuidanceTour[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...tours];
  return tours.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.key.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false) ||
      String(t.pageKey).toLowerCase().includes(q),
  );
}
