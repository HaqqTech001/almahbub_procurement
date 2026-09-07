import type {
  AttentionItem,
  DashboardStat,
  NotificationSummary,
  ProcurementRequestSummary,
  QuickAction,
} from "./types.js";
import type { ChartPoint } from "./charts/DashboardCharts.js";

export type ExecutiveKpiCard = DashboardStat & {
  definition?: string | undefined;
  timeRange?: string | undefined;
  freshness?: string | undefined;
  trend?: ChartPoint[] | undefined;
};

export type PipelineStage = {
  id: string;
  label: string;
  count: number;
  amount?: string | undefined;
};

export type SupplierPerformanceRow = {
  id: string;
  name: string;
  otif: number;
  quality: number;
  onTimeRate: number;
  href: string;
};

export type FinancialBucket = {
  id: string;
  label: string;
  amount: string;
  tone?: "neutral" | "positive" | "warning" | "danger" | undefined;
};

export type ShipmentStatusBucket = {
  id: string;
  label: string;
  count: number;
};

export type InventorySnapshot = {
  ready: boolean;
  skusTracked?: number | undefined;
  lowStock?: number | undefined;
  note: string;
};

export type CustomerActivityRow = {
  id: string;
  organizationName: string;
  event: string;
  at: string;
  href: string;
};

export type SystemHealthItem = {
  id: string;
  service: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  latencyMs?: number | undefined;
  detail?: string | undefined;
};

export type AiInsightCard = {
  id: string;
  title: string;
  summary: string;
  confidence: "high" | "moderate" | "low" | "unavailable";
  href?: string | undefined;
};

export type AuditEventRow = {
  id: string;
  action: string;
  actor: string;
  target: string;
  at: string;
  href?: string | undefined;
};

export type ExecutiveDashboardData = {
  kpis: ExecutiveKpiCard[];
  revenueSeries: ChartPoint[];
  pipeline: PipelineStage[];
  pendingApprovals: AttentionItem[];
  recentRequests: ProcurementRequestSummary[];
  supplierPerformance: SupplierPerformanceRow[];
  financialSummary: FinancialBucket[];
  shipmentStatus: ShipmentStatusBucket[];
  inventory: InventorySnapshot;
  customerActivity: CustomerActivityRow[];
  notifications: NotificationSummary[];
  systemHealth: SystemHealthItem[];
  aiInsights: AiInsightCard[];
  quickActions: QuickAction[];
  auditEvents: AuditEventRow[];
  procurementVolume: ChartPoint[];
  cashCollection: ChartPoint[];
};

export const EXECUTIVE_WIDGET_IDS = [
  "exec-kpis",
  "exec-revenue",
  "exec-pipeline",
  "exec-approvals",
  "exec-requests",
  "exec-suppliers",
  "exec-finance",
  "exec-shipments",
  "exec-inventory",
  "exec-customers",
  "exec-notifications",
  "exec-health",
  "exec-ai",
  "exec-actions",
  "exec-audit",
  "exec-heatmap",
] as const;

export type ExecutiveWidgetId = (typeof EXECUTIVE_WIDGET_IDS)[number];
