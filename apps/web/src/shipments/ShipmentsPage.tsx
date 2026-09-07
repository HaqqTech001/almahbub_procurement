import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShipmentWorkspace,
  type ShipmentCommand,
  type ShipmentConfirmDeliveryInput,
  type ShipmentCreateInput,
  type ShipmentRecord,
} from "@hamd/ui/shipments";

import { useAuth } from "../auth/session/AuthProvider.js";
import { HostAlert, HostPage } from "../components/HostChrome.js";
import {
  confirmShipmentDelivery,
  createShipment,
  getShipment,
  listShipments,
  requireShipmentToken,
  ShipmentApiError,
  transitionShipment,
} from "./shipment-api.js";

/**
 * Hosted shipment directory + detail - production API only.
 * Map tab uses an honest placeholder until a real mapAdapter is configured.
 */
export function ShipmentsPage({
  initialSelectedId,
}: {
  initialSelectedId?: string | undefined;
} = {}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ShipmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireShipmentToken(auth.ensureSession);
      setRows(await listShipments(token, { pageSize: 100 }));
    } catch (err) {
      setError(
        err instanceof ShipmentApiError
          ? err.message
          : "Unable to load shipments.",
      );
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
    <HostPage className="hamd-web-shipments hamd-list-queue">
      {error ? <HostAlert>{error}</HostAlert> : null}
      <ShipmentWorkspace
        shipments={rows}
        loading={loading}
        title="My shipments"
        initialSelectedId={initialSelectedId}
        canCreate={auth.permissions.includes("shipment:create")}
        canTransition={auth.permissions.includes("shipment:manage")}
        canConfirmDelivery={auth.permissions.includes("shipment:confirm")}
        mapAdapter={null}
        onSelect={(shipment) => {
          navigate(`/app/shipments/${shipment.id}`, { replace: true });
        }}
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
    </HostPage>
  );
}
