export {
  platformCacheRecommendations,
  lighthouseBundleBudgets,
  fontLoadingPolicy,
  buildSrcSet,
  preferModernImageFormats,
  getPublicPageHeadHints,
  type ResponsiveImageCandidate,
  type PublicPageHeadConfig,
  type PublicPageHeadLink,
} from "./budgets.js";
export {
  useIdleCallback,
  DeferredMount,
  type UseIdleCallbackOptions,
  type DeferredMountProps,
} from "./runtime.js";

/** Lazy entry for hosts that want the performance toolkit as its own chunk. */
export const performanceLazy = {
  runtime: () => import("./runtime.js"),
} as const;
