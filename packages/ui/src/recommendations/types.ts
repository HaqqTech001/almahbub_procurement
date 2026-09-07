/** Explainable recommendation contracts; hosts own ranking and data access. */

export const RECOMMENDATION_KINDS = [
  "products",
  "suppliers",
  "categories",
  "frequently_purchased_together",
  "recently_viewed",
  "trending",
  "seasonal",
] as const;
export type RecommendationKind = (typeof RECOMMENDATION_KINDS)[number];

export type RecommendationConfidence = "high" | "moderate" | "low";
export type RecommendationEntityType =
  | "product"
  | "supplier"
  | "category"
  | "bundle";

export type RecommendationEvidence = {
  id: string;
  label: string;
  href?: string | undefined;
};

export type RecommendationItem = {
  id: string;
  kind: RecommendationKind | string;
  entityType: RecommendationEntityType | string;
  entityId: string;
  title: string;
  summary?: string | undefined;
  href?: string | undefined;
  imageSrc?: string | undefined;
  imageAlt?: string | undefined;
  reason: string;
  confidence: RecommendationConfidence | string;
  confidenceReason?: string | undefined;
  evidence?: RecommendationEvidence[] | undefined;
  badges?: string[] | undefined;
  priceLabel?: string | undefined;
  leadTime?: string | undefined;
  supplierName?: string | undefined;
  categoryName?: string | undefined;
  productIds?: string[] | undefined;
  viewedAt?: string | undefined;
  rank?: number | undefined;
  seasonalWindow?: string | undefined;
};

export type RecommendationContext = {
  organizationId?: string | undefined;
  userId?: string | undefined;
  productId?: string | undefined;
  requestId?: string | undefined;
  categoryId?: string | undefined;
  locale?: string | undefined;
  currency?: string | undefined;
  consentedHistory?: boolean | undefined;
};

export type RecommendationFilters = {
  query: string;
  kind: "all" | string;
  minimumConfidence: "all" | RecommendationConfidence;
};

export type RecommendationFeedback =
  | "helpful"
  | "not_helpful"
  | "dismissed";

export const emptyRecommendationFilters = (): RecommendationFilters => ({
  query: "",
  kind: "all",
  minimumConfidence: "all",
});

export function recommendationKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    products: "Products",
    suppliers: "Suppliers",
    categories: "Categories",
    frequently_purchased_together: "Frequently purchased together",
    recently_viewed: "Recently viewed",
    trending: "Trending",
    seasonal: "Seasonal",
  };
  return labels[kind] ?? kind.replaceAll("_", " ");
}

export function recommendationConfidenceLabel(confidence: string): string {
  const labels: Record<string, string> = {
    high: "High confidence",
    moderate: "Moderate confidence",
    low: "Low confidence",
  };
  return labels[confidence] ?? confidence;
}

const confidenceRank: Record<string, number> = {
  low: 1,
  moderate: 2,
  high: 3,
};

export function filterRecommendations(
  items: RecommendationItem[],
  filters: RecommendationFilters,
): RecommendationItem[] {
  const query = filters.query.trim().toLowerCase();
  const minimum =
    filters.minimumConfidence === "all"
      ? 0
      : (confidenceRank[filters.minimumConfidence] ?? 0);

  return items
    .filter((item) => {
      if (filters.kind !== "all" && item.kind !== filters.kind) return false;
      if ((confidenceRank[item.confidence] ?? 0) < minimum) return false;
      if (!query) return true;
      return [
        item.title,
        item.summary ?? "",
        item.reason,
        item.supplierName ?? "",
        item.categoryName ?? "",
        ...(item.badges ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
}

export function groupRecommendations(
  items: RecommendationItem[],
): Array<{
  kind: RecommendationKind;
  label: string;
  items: RecommendationItem[];
}> {
  return RECOMMENDATION_KINDS.map((kind) => ({
    kind,
    label: recommendationKindLabel(kind),
    items: items.filter((item) => item.kind === kind),
  })).filter((group) => group.items.length > 0);
}
