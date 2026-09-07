import { useCallback, useEffect, useState } from "react";
import {
  ShipmentWorkspace,
  type ShipmentCommand,
  type ShipmentConfirmDeliveryInput,
  type ShipmentCreateInput,
  type ShipmentRecord,
} from "@hamd/ui/shipments";

import {
  confirmShipmentDelivery,
  createShipment,
  getShipment,
  listShipments,
  requireShipmentToken,
  transitionShipment,
} from "../api/shipment-api.js";
import { adviseOrder } from "../api/copilot-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsCopilotPanel } from "../components/OpsCopilotPanel.js";
import { OpsPage } from "../components/OpsChrome.js";

export function ShipmentsPage() {
  const auth = useAuth();
  const [rows, setRows] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await requireShipmentToken(auth.ensureSession);
      setRows(await listShipments(token, { pageSize: 100 }));
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const withToken = async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
    const token = await requireShipmentToken(auth.ensureSession);
    return fn(token);
  };

  return (
    <OpsPage className="hamd-ops-shipments hamd-list-queue">
      {rows[0] ? (
        <OpsCopilotPanel
          title={`Shipment copilot · ${rows[0].publicCode}`}
          description="Explain delays, estimate delivery, and suggest fulfillment actions."
          actions={[
            {
              id: "delays",
              label: "Explain delays",
              run: async () => {
                const token = getAccessToken() ?? (await auth.ensureSession());
                if (!token) throw new Error("Sign in required.");
                return adviseOrder(token, {
                  shipmentId: rows[0]!.id,
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
                  shipmentId: rows[0]!.id,
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
                  shipmentId: rows[0]!.id,
                  focus: "actions",
                });
              },
            },
          ]}
        />
      ) : null}
      <ShipmentWorkspace
        shipments={rows}
        loading={loading}
        title="All shipments"
        canCreate={auth.permissions.includes("shipment:create")}
        canTransition={auth.permissions.includes("shipment:manage")}
        canConfirmDelivery={auth.permissions.includes("shipment:confirm")}
        mapAdapter={null}
        onCreate={async (input: ShipmentCreateInput) => {
          await withToken((token) => createShipment(token, input));
          await refresh();
        }}
        onTransition={async (
          shipmentId,
          command: ShipmentCommand,
          meta,
        ) => {
          await withToken((token) =>
            transitionShipment(token, shipmentId, command, meta),
          );
          await refresh();
        }}
        onConfirmDelivery={async (
          shipmentId,
          input: ShipmentConfirmDeliveryInput,
          meta,
        ) => {
          await withToken((token) =>
            confirmShipmentDelivery(token, shipmentId, input, meta),
          );
          await refresh();
        }}
        onRefreshTracking={async (shipmentId) => {
          const updated = await withToken((token) =>
            getShipment(token, shipmentId),
          );
          setRows((prev) =>
            prev.map((row) => (row.id === shipmentId ? updated : row)),
          );
        }}
      />
    </OpsPage>
  );
}
