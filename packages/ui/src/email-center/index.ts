export type * from "./types.js";
export {
  EMAIL_TEMPLATE_KINDS,
  EMAIL_TEMPLATE_STATUSES,
  emailTemplateKindLabel,
  emailTemplateStatusLabel,
  emptyEmailFilters,
  filterEmailTemplates,
  paginateEmailTemplates,
  renderEmailTemplate,
  sampleVariablesFrom,
} from "./types.js";
export {
  EmailCenterWorkspace,
  EmailCenterWorkspaceSkeleton,
} from "./EmailCenterWorkspace.js";
export type {
  EmailCenterTab,
  EmailCenterWorkspaceProps,
} from "./EmailCenterWorkspace.js";
export { useEmailDirectory } from "./useEmailDirectory.js";
export { emailTemplatesFixture } from "./fixtures.js";

export const emailCenterLazy = {
  EmailCenterWorkspace: () => import("./EmailCenterWorkspace.js"),
} as const;
