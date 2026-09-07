import { useCallback, useEffect, useState } from "react";
import {
  GuidanceAdminWorkspace,
  type GuidanceAnalyticsSummary,
  type GuidanceTour,
  type GuidanceTourDraftInput,
} from "@hamd/ui/guidance";

import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { OpsApiError, opsFetch } from "../lib/ops-fetch.js";

export function GuidanceAdminPage() {
  const auth = useAuth();
  const canManage = auth.permissions.includes("guidance:manage");
  const [tours, setTours] = useState<GuidanceTour[]>([]);
  const [analytics, setAnalytics] = useState<GuidanceAnalyticsSummary | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tokenOrThrow = async () => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) throw new Error("Sign in required.");
    return token;
  };

  const refresh = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const token = await tokenOrThrow();
      const [tourRows, summary] = await Promise.all([
        opsFetch<GuidanceTour[]>("/admin/guidance/tours", { accessToken: token }),
        opsFetch<GuidanceAnalyticsSummary>("/admin/guidance/analytics", {
          accessToken: token,
        }).catch(() => undefined),
      ]);
      setTours(tourRows);
      setAnalytics(summary);
    } catch (err) {
      setError(
        err instanceof OpsApiError ? err.message : "Unable to load guidance tours.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth, canManage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!canManage) {
    return (
      <OpsPage>
        <OpsAlert>Guidance administration requires the guidance:manage permission.</OpsAlert>
      </OpsPage>
    );
  }

  return (
    <OpsPage className="hamd-list-queue hamd-ops-guidance-admin">
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      <GuidanceAdminWorkspace
        title="Guidance Admin"
        tours={tours}
        analytics={analytics}
        loading={loading}
        onCreate={async (input: GuidanceTourDraftInput) => {
          const token = await tokenOrThrow();
          await opsFetch("/admin/guidance/tours", {
            method: "POST",
            accessToken: token,
            body: input,
          });
          setSuccess("Tour created.");
          await refresh();
        }}
        onUpdate={async (tourId, input) => {
          const token = await tokenOrThrow();
          await opsFetch(`/admin/guidance/tours/${tourId}`, {
            method: "PATCH",
            accessToken: token,
            body: input,
          });
          setSuccess("Tour updated.");
          await refresh();
        }}
        onPublish={async (tourId) => {
          const token = await tokenOrThrow();
          await opsFetch(`/admin/guidance/tours/${tourId}/publish`, {
            method: "POST",
            accessToken: token,
            body: {},
          });
          setSuccess("Tour published.");
          await refresh();
        }}
        onUnpublish={async (tourId) => {
          const token = await tokenOrThrow();
          await opsFetch(`/admin/guidance/tours/${tourId}/unpublish`, {
            method: "POST",
            accessToken: token,
            body: {},
          });
          setSuccess("Tour unpublished.");
          await refresh();
        }}
        onSchedule={async (tourId, scheduledFor) => {
          const token = await tokenOrThrow();
          await opsFetch(`/admin/guidance/tours/${tourId}/schedule`, {
            method: "POST",
            accessToken: token,
            body: { scheduledFor },
          });
          setSuccess("Tour scheduled.");
          await refresh();
        }}
        onResetUserProgress={async (userId) => {
          const token = await tokenOrThrow();
          await opsFetch(`/admin/guidance/users/${userId}/reset-progress`, {
            method: "POST",
            accessToken: token,
            body: {},
          });
          setSuccess("User guidance progress reset.");
        }}
      />
    </OpsPage>
  );
}
