export type * from "./types.js";
export {
  PLATFORM_CONFIG_FIELDS,
  PLATFORM_CONFIG_SECTIONS,
  diffPlatformConfig,
  fieldsForSection,
  platformConfigSectionLabel,
  sectionForField,
  validatePlatformConfig,
} from "./types.js";
export {
  PlatformConfigWorkspace,
  PlatformConfigWorkspaceSkeleton,
} from "./PlatformConfigWorkspace.js";
export type {
  PlatformConfigWorkspaceProps,
  PlatformConfigWorkspaceTab,
} from "./PlatformConfigWorkspace.js";
export {
  platformConfigChangeLogFixture,
  platformConfigDocumentFixture,
  platformConfigValuesFixture,
  platformConfigVersionsFixture,
} from "./fixtures.js";

export const platformConfigLazy = {
  PlatformConfigWorkspace: () => import("./PlatformConfigWorkspace.js"),
} as const;
