import { useCallback, useEffect, useState } from "react";
import { AuditWorkspace, type AuditEvent } from "@hamd/ui/audit";

import {
  fetchOpsAuditEvents,
  OpsApiError,
  requireToken,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage } from "../components/OpsChrome.js";
import { downloadCsv } from "../lib/csv.js";

export function AuditPage() {
  const auth = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const live = await fetchOpsAuditEvents(token);
      setEvents(live?.events ?? []);
    } catch (err) {
      setEvents([]);
      setError(
        err instanceof OpsApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to load audit events.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <OpsPage className="hamd-ops-audit hamd-list-queue">
      {error ? (
        <OpsAlert>
          {error}{" "}
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            onClick={() => {
              setLoading(true);
              void refresh();
            }}
          >
            Retry
          </button>
        </OpsAlert>
      ) : null}
      <AuditWorkspace
        events={events}
        loading={loading}
        canExport={
          auth.permissions.includes("audit:read") ||
          auth.permissions.includes("ops:access")
        }
        onExport={async (request) => {
          const rows = events.map((event) => ({
            id: event.id,
            category: event.category,
            action: event.action,
            outcome: event.outcome,
            actor: event.actor.name,
            occurredAt: event.occurredAt,
            format: request.format,
          }));
          downloadCsv("audit-events.csv", rows);
        }}
      />
    </OpsPage>
  );
}
