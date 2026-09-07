export type * from "./types.js";
export {
  RECOMMENDATION_KINDS,
  emptyRecommendationFilters,
  filterRecommendations,
  groupRecommendations,
  recommendationConfidenceLabel,
  recommendationKindLabel,
} from "./types.js";
export {
  RecommendationEngine,
  RecommendationEngineSkeleton,
} from "./RecommendationEngine.js";
export type { RecommendationEngineProps } from "./RecommendationEngine.js";
export { recommendationFixture } from "./fixtures.js";

export const recommendationsLazy = {
  RecommendationEngine: () => import("./RecommendationEngine.js"),
} as const;
