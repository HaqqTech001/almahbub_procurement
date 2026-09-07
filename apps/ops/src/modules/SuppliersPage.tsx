import { useCallback, useEffect, useState } from "react";
import {
  SupplierWorkspace,
  supplierRecordsFixture,
  type SupplierRecord,
} from "@hamd/ui/suppliers";

import { fetchOpsSuppliers, OpsApiError, requireToken } from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage } from "../components/OpsChrome.js";

export function SuppliersPage() {
  const auth = useAuth();
  const [rows, setRows] = useState<SupplierRecord[]>(supplierRecordsFixture);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFixtures, setUsingFixtures] = useState(true);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const live = await fetchOpsSuppliers(token);
      if (live) {
        setRows(live);
        setUsingFixtures(false);
      } else {
        setRows(supplierRecordsFixture);
        setUsingFixtures(true);
      }
    } catch (err) {
      setRows(supplierRecordsFixture);
      setUsingFixtures(true);
      if (err instanceof OpsApiError && (err.status === 401 || err.status === 403)) {
        setError(err.message);
      } else if (!(err instanceof OpsApiError && (err.status === 404 || err.status === 501))) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load suppliers. Showing fixtures.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <OpsPage className="hamd-ops-suppliers hamd-list-queue">
      {usingFixtures && !loading ? (
        <OpsAlert tone="info">
          Live suppliers API unavailable - showing fixtures.
        </OpsAlert>
      ) : null}
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      <SupplierWorkspace
        suppliers={rows}
        loading={loading}
        canApprove={auth.permissions.includes("supplier:approve")}
        canSuspend={auth.permissions.includes("supplier:suspend")}
        canVerify={auth.permissions.includes("supplier:verify")}
        onAdminAction={async () => {
          if (
            !auth.permissions.includes("supplier:approve") &&
            !auth.permissions.includes("supplier:suspend") &&
            !auth.permissions.includes("supplier:verify")
          ) {
            throw new OpsApiError("Missing supplier admin permission.", 403, "FORBIDDEN");
          }
          throw new OpsApiError(
            "Supplier admin mutations require /api/v1/ops/suppliers.",
            501,
            "NOT_IMPLEMENTED",
          );
        }}
      />
    </OpsPage>
  );
}
