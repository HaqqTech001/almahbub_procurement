export type * from "./types.js";
export {
  QUOTATION_COMMANDS,
  QUOTATION_STATUSES,
  availableQuotationCommands,
  canReviseQuotation,
  computeQuotationTotal,
  emptyQuotationFilters,
  filterQuotations,
  formatMoney,
  isQuotationExpired,
  lineAmount,
  paginateQuotationRows,
  quotationCommandLabel,
  quotationStatusLabel,
} from "./types.js";
export {
  QuotationWorkspace,
  QuotationWorkspaceSkeleton,
} from "./QuotationWorkspace.js";
export type {
  QuotationWorkspaceProps,
  QuotationWorkspaceTab,
} from "./QuotationWorkspace.js";
export { QuotationCompareView } from "./QuotationCompareView.js";
export type { QuotationCompareViewProps } from "./QuotationCompareView.js";
export { QuotationHistoryBoard } from "./QuotationHistoryBoard.js";
export type { QuotationHistoryBoardProps } from "./QuotationHistoryBoard.js";
export { useQuotationDirectory } from "./useQuotationDirectory.js";
export type { QuotationSortKey } from "./useQuotationDirectory.js";
export { quotationRecordsFixture } from "./fixtures.js";
export {
  createUnavailableAiAdapter,
  runQuotationAiComparison,
} from "./ai-comparison.js";
export type {
  QuotationAiComparisonAdapter,
  QuotationAiComparisonInsight,
  QuotationAiComparisonRequest,
  QuotationAiComparisonResult,
  QuotationAiComparisonState,
} from "./ai-comparison.js";

export const quotationsLazy = {
  QuotationWorkspace: () => import("./QuotationWorkspace.js"),
  QuotationCompareView: () => import("./QuotationCompareView.js"),
  QuotationHistoryBoard: () => import("./QuotationHistoryBoard.js"),
};
