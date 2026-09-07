export type * from "./types.js";
export type * from "./executive-types.js";
export { ClientWorkspaceShell } from "./ClientWorkspaceShell.js";
export type { ClientWorkspaceShellProps } from "./ClientWorkspaceShell.js";
export {
  DashboardWidget,
  DashboardWidgetSkeleton,
} from "./DashboardWidget.js";
export type { DashboardWidgetProps } from "./DashboardWidget.js";
export { VirtualizedList } from "./VirtualizedList.js";
export type { VirtualizedListProps } from "./VirtualizedList.js";
export { useOptimisticItems } from "./useOptimisticItems.js";
export type { OptimisticAction } from "./useOptimisticItems.js";
export { useDashboardLayout } from "./useDashboardLayout.js";
export type {
  DashboardWidgetLayoutState,
  UseDashboardLayoutOptions,
} from "./useDashboardLayout.js";
export { ActivityFeed, formatActivityWhen } from "./ActivityFeed.js";
export type {
  ActivityFeedProps,
  ActivityItem,
  ActivityKind,
} from "./ActivityFeed.js";
export { ClientDashboard } from "./ClientDashboard.js";
export type {
  ClientDashboardData,
  ClientDashboardProps,
} from "./ClientDashboard.js";
export {
  ExecutiveDashboard,
  ExecutiveDashboardSkeleton,
} from "./ExecutiveDashboard.js";
export type { ExecutiveDashboardProps } from "./ExecutiveDashboard.js";
export { dashboardFixture } from "./fixtures.js";
export {
  executiveDashboardFixture,
  executiveLayoutDefaults,
} from "./executive-fixtures.js";
export {
  AreaChart,
  BarChart,
  DonutChart,
  HeatmapPlaceholder,
  LineChart,
} from "./charts/DashboardCharts.js";
export type { ChartPoint, ChartSeries } from "./charts/DashboardCharts.js";
export {
  AttentionQueueWidget,
  OverviewHeader,
  QuickActionsWidget,
  RecentRequestsWidget,
  StatisticsStrip,
} from "./widgets/DashboardWidgets.js";
export {
  ActiveRfqsWidget,
  BookmarksWidget,
  DocumentsWidget,
  InvoicesWidget,
  MessagesWidget,
  NotificationsWidget,
  OrdersWidget,
  PaymentsWidget,
  QuotationsWidget,
  RecentlyViewedProductsWidget,
  RecommendationsWidget,
  ShipmentsWidget,
} from "./widgets/DashboardWidgetsDeferred.js";

/** Lazy entry for host route code-splitting. */
export const dashboardLazy = {
  ClientDashboard: () => import("./ClientDashboard.js"),
  ClientWorkspaceShell: () => import("./ClientWorkspaceShell.js"),
  ExecutiveDashboard: () => import("./ExecutiveDashboard.js"),
  DashboardWidgetsDeferred: () => import("./widgets/DashboardWidgetsDeferred.js"),
  DashboardCharts: () => import("./charts/DashboardCharts.js"),
} as const;
