/** Enterprise Analytics contracts - docs/23; hosts inject API/exports. */

export const ANALYTICS_METRIC_KEYS = [
  "visitors",
  "registered_users",
  "conversion_rate",
  "procurement_requests",
  "supplier_activity",
  "quotation_acceptance",
  "revenue",
  "response_time",
  "order_completion",
  "customer_satisfaction",
] as const;
export type AnalyticsMetricKey = (typeof ANALYTICS_METRIC_KEYS)[number];

export const ANALYTICS_PERIODS = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "custom",
] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const ANALYTICS_EXPORT_FORMATS = ["csv", "excel", "pdf"] as const;
export type AnalyticsExportFormat = (typeof ANALYTICS_EXPORT_FORMATS)[number];

export type AnalyticsTone = "neutral" | "positive" | "warning" | "danger";

export type AnalyticsSeriesPoint = {
  label: string;
  value: number;
};

export type AnalyticsMetric = {
  key: AnalyticsMetricKey | string;
  label: string;
  value: string;
  unit?: string | undefined;
  delta?: string | undefined;
  tone?: AnalyticsTone | undefined;
  definition?: string | undefined;
  freshnessAt?: string | undefined;
  series: AnalyticsSeriesPoint[];
};

export type AnalyticsFilters = {
  period: AnalyticsPeriod;
  /** ISO date (YYYY-MM-DD) - used when period is `custom`. */
  from?: string | undefined;
  /** ISO date (YYYY-MM-DD) - used when period is `custom`. */
  to?: string | undefined;
};

export type AnalyticsSnapshot = {
  generatedAt: string;
  timezone?: string | undefined;
  currency?: string | undefined;
  metrics: AnalyticsMetric[];
};

export type AnalyticsExportRequest = {
  format: AnalyticsExportFormat;
  filters: AnalyticsFilters;
  metricKeys?: string[] | undefined;
};

export const emptyAnalyticsFilters = (): AnalyticsFilters => ({
  period: "monthly",
  from: undefined,
  to: undefined,
});

export function analyticsMetricLabel(key: string): string {
  const labels: Record<string, string> = {
    visitors: "Visitors",
    registered_users: "Registered users",
    conversion_rate: "Conversion rate",
    procurement_requests: "Procurement requests",
    supplier_activity: "Supplier activity",
    quotation_acceptance: "Quotation acceptance",
    revenue: "Revenue",
    response_time: "Response time",
    order_completion: "Order completion",
    customer_satisfaction: "Customer satisfaction",
  };
  return labels[key] ?? key.replaceAll("_", " ");
}

export function analyticsPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
    custom: "Custom range",
  };
  return labels[period] ?? period;
}

export function analyticsExportLabel(format: string): string {
  const labels: Record<string, string> = {
    csv: "CSV",
    excel: "Excel",
    pdf: "PDF",
  };
  return labels[format] ?? format.toUpperCase();
}

export function filterAnalyticsMetrics(
  metrics: AnalyticsMetric[],
  query: string,
): AnalyticsMetric[] {
  const q = query.trim().toLowerCase();
  if (!q) return metrics;
  return metrics.filter((m) =>
    [m.key, m.label, m.definition ?? "", analyticsMetricLabel(String(m.key))]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}
