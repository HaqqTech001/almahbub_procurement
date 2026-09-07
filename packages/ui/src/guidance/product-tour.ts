/**
 * Platform Interactive Product Tour - role model, versioning, and catalog contracts.
 * Hosts inject CMS/API via ProductTourCatalog; fixtures are the local default source.
 */

import type { GuidanceTip, GuidanceTour, GuidanceUserProgress } from "./types.js";

export const PRODUCT_TOUR_ROLES = [
  "public_visitor",
  "client",
  "administrator",
  "supplier",
] as const;

export type ProductTourRole = (typeof PRODUCT_TOUR_ROLES)[number];

/** Maps product roles → guidance audiences (CMS / Prisma). */
export const PRODUCT_TOUR_ROLE_AUDIENCES: Record<
  ProductTourRole,
  readonly string[]
> = {
  public_visitor: ["public_visitor"],
  client: ["client_workspace", "all_authenticated"],
  administrator: [
    "operations_console",
    "all_authenticated",
    "client_workspace",
  ],
  supplier: ["supplier_portal", "all_authenticated"],
};

export type ResolveProductTourRoleInput = {
  isAuthenticated: boolean;
  permissions?: readonly string[] | undefined;
};

/**
 * Resolve the active product-tour role from auth context.
 * Supplier is future-ready via `supplier:*` permissions.
 */
export function resolveProductTourRole(
  input: ResolveProductTourRoleInput,
): ProductTourRole {
  if (!input.isAuthenticated) return "public_visitor";
  const permissions = input.permissions ?? [];
  if (
    permissions.some(
      (p) =>
        p === "guidance:manage" ||
        p.startsWith("admin:") ||
        p.includes("platform:manage") ||
        p.includes("cms:manage"),
    )
  ) {
    return "administrator";
  }
  if (permissions.some((p) => p.startsWith("supplier:"))) {
    return "supplier";
  }
  return "client";
}

export function filterToursForRole(
  tours: readonly GuidanceTour[],
  role: ProductTourRole,
): GuidanceTour[] {
  const allowed = new Set(PRODUCT_TOUR_ROLE_AUDIENCES[role]);
  return tours.filter((tour) => allowed.has(String(tour.audience)));
}

export function tourContentVersion(tour: GuidanceTour): number {
  return tour.version ?? 1;
}

/**
 * True when a completed/skipped tour should re-offer because CMS bumped version.
 */
export function isTourVersionStale(
  tour: GuidanceTour,
  progress: GuidanceUserProgress | undefined,
): boolean {
  if (!progress) return false;
  if (progress.status !== "completed" && progress.status !== "skipped") {
    return false;
  }
  const seen = progress.tourVersion ?? 1;
  return tourContentVersion(tour) > seen;
}

export function shouldAutoOfferTour(input: {
  tour: GuidanceTour;
  progress: GuidanceUserProgress | undefined;
  suppressedTourKeys: readonly string[];
}): boolean {
  const { tour, progress, suppressedTourKeys } = input;
  if (tour.status !== "published") return false;
  if (suppressedTourKeys.includes(tour.key)) return false;
  if (!progress || progress.status === "not_started") return true;
  /* One completed step must not disable the tour - resume in-progress. */
  if (progress.status === "in_progress") return true;
  if (isTourVersionStale(tour, progress)) return true;
  return false;
}

export type ProductTourCatalog = {
  /** Stable catalog id for telemetry / cache keys. */
  id: string;
  /** Bumps when the whole catalog ship changes (admin publish). */
  catalogVersion: number;
  getTours: () => Promise<readonly GuidanceTour[]> | readonly GuidanceTour[];
  getTips?: (() => Promise<readonly GuidanceTip[]> | readonly GuidanceTip[]) | undefined;
};

/** Static / fixture catalog - swap for remote CMS loader without rewriting hosts. */
export function createStaticTourCatalog(input: {
  id?: string;
  catalogVersion?: number;
  tours: readonly GuidanceTour[];
  tips?: readonly GuidanceTip[];
}): ProductTourCatalog {
  return {
    id: input.id ?? "static",
    catalogVersion: input.catalogVersion ?? 1,
    getTours: () => input.tours,
    getTips: () => input.tips ?? [],
  };
}

/**
 * Future-ready remote catalog - administrators update tours via API without
 * rewriting the product tour engine.
 */
export function createRemoteTourCatalog(input: {
  id?: string;
  catalogVersion?: number;
  fetchTours: () => Promise<readonly GuidanceTour[]>;
  fetchTips?: (() => Promise<readonly GuidanceTip[]>) | undefined;
}): ProductTourCatalog {
  const catalog: ProductTourCatalog = {
    id: input.id ?? "remote",
    catalogVersion: input.catalogVersion ?? 1,
    getTours: () => input.fetchTours(),
  };
  if (input.fetchTips) {
    catalog.getTips = () => input.fetchTips!();
  }
  return catalog;
}

export async function loadCatalogTours(
  catalog: ProductTourCatalog,
): Promise<GuidanceTour[]> {
  return [...(await catalog.getTours())];
}

export async function loadCatalogTips(
  catalog: ProductTourCatalog,
): Promise<GuidanceTip[]> {
  if (!catalog.getTips) return [];
  return [...(await catalog.getTips())];
}
