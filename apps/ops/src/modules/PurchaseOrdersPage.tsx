import { useCallback, useEffect, useState } from "react";
import {
  PurchaseOrderWorkspace,
  purchaseOrderRecordsFixture,
  type PurchaseOrderRecord,
} from "@hamd/ui/purchase-orders";

import {
  fetchOpsPurchaseOrders,
  OpsApiError,
  requireToken,
} from "../api/ops-api.js";
import { adviseOrder } from "../api/copilot-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsAlert, OpsPage } from "../components/OpsChrome.js";
import { OpsCopilotPanel } from "../components/OpsCopilotPanel.js";

export function PurchaseOrdersPage() {
  const auth = useAuth();
  const [rows, setRows] = useState<PurchaseOrderRecord[]>(
    purchaseOrderRecordsFixture,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFixtures, setUsingFixtures] = useState(true);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      const live = await fetchOpsPurchaseOrders(token);
      if (live) {
        setRows(live);
        setUsingFixtures(false);
      } else {
        setRows(purchaseOrderRecordsFixture);
        setUsingFixtures(true);
      }
    } catch (err) {
      setRows(purchaseOrderRecordsFixture);
      setUsingFixtures(true);
      if (err instanceof OpsApiError && (err.status === 401 || err.status === 403)) {
        setError(err.message);
      } else if (!(err instanceof OpsApiError && (err.status === 404 || err.status === 501))) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load purchase orders. Showing fixtures.",
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
    <OpsPage className="hamd-ops-purchase-orders hamd-list-queue">
      {usingFixtures && !loading ? (
        <OpsAlert tone="info">
          Live purchase-orders API unavailable - showing fixtures.
        </OpsAlert>
      ) : null}
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {!usingFixtures && rows[0] ? (
        <OpsCopilotPanel
          title={`Order copilot · ${rows[0].publicCode}`}
          description="Explain delays, estimate delivery, and suggest actions for the lead purchase order."
          actions={[
            {
              id: "delays",
              label: "Explain delays",
              run: async () => {
                const token = getAccessToken() ?? (await auth.ensureSession());
                if (!token) throw new Error("Sign in required.");
                return adviseOrder(token, {
                  purchaseOrderId: rows[0]!.id,
                  focus: "delays",
                });
              },
            },
            {
              id: "delivery",
              label: "Estimate delivery",
              run: async () => {
                const token = getAccessToken() ?? (await auth.ensureSession());
                if (!token) throw new Error("Sign in required.");
                return adviseOrder(token, {
                  purchaseOrderId: rows[0]!.id,
                  focus: "delivery",
                });
              },
            },
            {
              id: "actions",
              label: "Suggest actions",
              run: async () => {
                const token = getAccessToken() ?? (await auth.ensureSession());
                if (!token) throw new Error("Sign in required.");
                return adviseOrder(token, {
                  purchaseOrderId: rows[0]!.id,
                  focus: "actions",
                });
              },
            },
          ]}
        />
      ) : null}
      <PurchaseOrderWorkspace
        orders={rows}
        loading={loading}
        canCreate={auth.permissions.includes("po:create")}
        canTransition={
          auth.permissions.includes("po:manage") ||
          auth.permissions.includes("po:issue")
        }
        onCreate={async () => {
          throw new OpsApiError(
            "PO create requires /api/v1/ops/purchase-orders.",
            501,
            "NOT_IMPLEMENTED",
          );
        }}
        onTransition={async () => {
          throw new OpsApiError(
            "PO transitions require /api/v1/ops/purchase-orders.",
            501,
            "NOT_IMPLEMENTED",
          );
        }}
      />
    </OpsPage>
  );
}
