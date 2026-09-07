export type * from "./types.js";
export {
  ASSISTANT_CAPABILITIES,
  ASSISTANT_CAPABILITY_DESCRIPTORS,
  ASSISTANT_CONFIDENCE,
  ASSISTANT_MODES,
  ASSISTANT_SUGGESTION_KINDS,
  assistantCapabilityLabel,
  assistantConfidenceLabel,
  assistantModeLabel,
  assistantSuggestionKindLabel,
  emptyAssistantFilters,
  filterAssistantSuggestions,
  groupSuggestionsByKind,
} from "./types.js";
export {
  AssistantWorkspace,
  AssistantWorkspaceSkeleton,
} from "./AssistantWorkspace.js";
export type {
  AssistantWorkspaceProps,
  AssistantWorkspaceTab,
} from "./AssistantWorkspace.js";
export { useAssistantSession } from "./useAssistantSession.js";
export type { UseAssistantSessionOptions } from "./useAssistantSession.js";
export {
  assistantMessagesFixture,
  assistantSuggestionsFixture,
} from "./fixtures.js";

export const assistantLazy = {
  AssistantWorkspace: () => import("./AssistantWorkspace.js"),
} as const;
