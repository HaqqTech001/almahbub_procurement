export * from "./types.js";
export * from "./page-registry.js";
export * from "./fixtures.js";
export * from "./product-tour.js";
export {
  GuidanceProvider,
  useGuidance,
  useOptionalGuidance,
  type GuidanceHandlers,
  type GuidanceProviderProps,
  type GuidanceContextValue,
} from "./GuidanceProvider.js";
export { GuidanceContext } from "./guidance-context.js";
export { WelcomeModal, type WelcomeModalProps } from "./WelcomeModal.js";
export { GuideControl, type GuideControlProps } from "./GuideControl.js";
export { TourRunner, type TourRunnerProps } from "./TourRunner.js";
export { LearningCenter, type LearningCenterProps } from "./LearningCenter.js";
export { FeatureDiscovery, type FeatureDiscoveryProps } from "./FeatureDiscovery.js";
export { SmartHelp, type SmartHelpProps } from "./SmartHelp.js";
export {
  Spotlight,
  useSpotlightTarget,
  calloutStyle,
  calloutLayout,
  type SpotlightProps,
  type SpotlightRect,
  type CalloutLayout,
} from "./Spotlight.js";
export {
  expandTourSelector,
  queryVisibleTourTarget,
  needsWorkspaceDrawer,
  openWorkspaceDrawer,
  measureTourTarget,
} from "./tour-target.js";
export {
  GuidanceAdminWorkspace,
  type GuidanceAdminWorkspaceProps,
} from "./GuidanceAdminWorkspace.js";
export { GuidanceRoot, type GuidanceRootProps } from "./GuidanceRoot.js";
export { guidanceLazySurfaces } from "./lazy.js";
