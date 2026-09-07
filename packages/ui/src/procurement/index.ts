export type * from "./types.js";
export {
  MISSION_STATUS_ALIASES,
  PROCUREMENT_COMMANDS,
  PROCUREMENT_PRIORITIES,
  PROCUREMENT_REQUEST_STATUSES,
  availableCommands,
  commandLabel,
  emptyProcurementFilters,
  filterProcurementRequests,
  missionPhaseForStatus,
  paginateProcurementRows,
  procurementStatusLabel,
  procurementActionRequiredCopy,
  procurementLobLabel,
  procurementPriorityLabel,
} from "./types.js";
export {
  ProcurementWorkspace,
  ProcurementWorkspaceSkeleton,
} from "./ProcurementWorkspace.js";
export type {
  ProcurementWorkspaceProps,
  ProcurementWorkspaceTab,
} from "./ProcurementWorkspace.js";
export {
  useProcurementDirectory,
  useRequestDraft,
} from "./useProcurementDirectory.js";
export { procurementRequestsFixture } from "./fixtures.js";
export {
  RequestCreateWizard,
  REQUEST_WIZARD_STEPS,
  defaultCatalogProducts,
  defaultRequestTemplates,
  emptyRequestWizardDraft,
} from "./RequestCreateWizard.js";
export type {
  CatalogProductOption,
  RequestCreateWizardProps,
  RequestTemplate,
  RequestWizardDraft,
  RequestWizardStepId,
  RequestWizardSubmitPayload,
} from "./RequestCreateWizard.js";
export {
  BUYER_JOURNEY_STAGES,
  REQUEST_LIFECYCLE_STAGES,
  adminQuotationCommands,
  adminRequestCommands,
  buyerJourneyIndex,
  contextualLifecycleState,
  customerQuotationCommands,
  customerRequestCommands,
  lifecycleStageIndex,
  mapBuyerJourneyStage,
  mapRequestLifecycleStage,
  relatedStateLabel,
} from "./lifecycle.js";
export { ProcurementProgress } from "./ProcurementProgress.js";
export type {
  ProcurementProgressProps,
  ProcurementProgressVariant,
} from "./ProcurementProgress.js";
export type {
  RequestLifecycleStageId,
  RequestRelatedSummary,
} from "./lifecycle.js";
export { RequestHub, RequestLifecycle } from "./RequestHub.js";
export type { RequestHubRow, RequestRelatedDto } from "./RequestHub.js";
export { BuyerRequestsWorkspace } from "./BuyerRequestsWorkspace.js";
export type {
  BuyerRequestRecord,
  BuyerSummaryItem,
} from "./BuyerRequestsWorkspace.js";
export { RequestDetailView, requestFinanceLabel } from "./RequestDetailView.js";
export type { RequestDetailModel } from "./RequestDetailView.js";
export {
  CLARIFICATION_AREAS,
  CLARIFICATION_FIELD_LABELS,
  clarificationFieldsFromRequest,
  encodeClarificationItems,
  formatClarificationReason,
  isMeaningfulClarificationQuestion,
  parseClarificationReason,
} from "./clarification.js";
export type { ClarificationArea, ParsedClarification } from "./clarification.js";

export const procurementLazy = {
  ProcurementWorkspace: () => import("./ProcurementWorkspace.js"),
  RequestCreateWizard: () => import("./RequestCreateWizard.js"),
} as const;
