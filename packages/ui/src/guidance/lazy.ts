/** Lazy guidance surface map - hosts code-split the engine. */
export const guidanceLazySurfaces = {
  GuidanceRoot: () => import("./GuidanceRoot.js"),
  GuideControl: () => import("./GuideControl.js"),
  LearningCenter: () => import("./LearningCenter.js"),
  GuidanceAdminWorkspace: () => import("./GuidanceAdminWorkspace.js"),
  WelcomeModal: () => import("./WelcomeModal.js"),
  TourRunner: () => import("./TourRunner.js"),
} as const;
