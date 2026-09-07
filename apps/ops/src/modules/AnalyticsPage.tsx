import { useState } from "react";
import {
  AnalyticsWorkspace,
  analyticsSnapshotFixture,
  type AnalyticsExportRequest,
  type AnalyticsSnapshot,
} from "@hamd/ui/analytics";

import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { downloadCsv, downloadTsv, printReportWindow } from "../lib/csv.js";

export function AnalyticsPage() {
  const auth = useAuth();
  const [snapshot] = useState<AnalyticsSnapshot>(analyticsSnapshotFixture);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <OpsPage className="hamd-ops-analytics">
      <OpsAlert tone="info">
        Analytics host uses fixtures until an analytics API is wired.
      </OpsAlert>
      {message ? <OpsStatus tone="success">{message}</OpsStatus> : null}
      <AnalyticsWorkspace
        snapshot={snapshot}
        canExport={
          auth.permissions.includes("analytics:export") ||
          auth.permissions.includes("report:export") ||
          auth.permissions.includes("ops:access")
        }
        onExport={async (request: AnalyticsExportRequest) => {
          const rows = snapshot.metrics.map((metric) => ({
            key: metric.key,
            label: metric.label,
            value: metric.value,
            format: request.format,
            period: request.filters.period,
          }));
          if (request.format === "pdf") {
            printReportWindow(
              "Analytics export",
              `<pre>${JSON.stringify(rows, null, 2)}</pre>`,
            );
          } else if (request.format === "excel") {
            downloadTsv(`analytics-${Date.now()}.tsv`, rows);
          } else {
            downloadCsv(`analytics-${Date.now()}.csv`, rows);
          }
          setMessage(`Exported analytics as ${request.format}.`);
        }}
      />
    </OpsPage>
  );
}
