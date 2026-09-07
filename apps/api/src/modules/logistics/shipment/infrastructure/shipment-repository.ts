import type { Prisma } from "@hamd/database";

import type { CreateShipmentInput, ListShipmentsInput, UpdateShipmentInput } from "../api/shipment-schemas.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";

const actorSelect = {
  displayName: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const shipmentInclude = {
  containers: true,
  documents: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
  inspections: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
  milestones: { orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }] },
  history: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
    include: { actor: { select: actorSelect } },
  },
  confirmedBy: { select: actorSelect },
  purchaseOrder: {
    select: {
      publicCode: true,
      request: {
        select: {
          publicCode: true,
          destinationCountryCode: true,
          destinationAddress: true,
          title: true,
        },
      },
    },
  },
} as const satisfies Prisma.ShipmentInclude;

export type ShipmentRecord = Prisma.ShipmentGetPayload<{ include: typeof shipmentInclude }>;

export class ShipmentRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public findById(organizationId: string, id: string): Promise<ShipmentRecord | null> {
    return this.database.shipment.findFirst({ where: { id, organizationId }, include: shipmentInclude });
  }

  public list(organizationId: string, input: ListShipmentsInput): Promise<ShipmentRecord[]> {
    return this.database.shipment.findMany({
      where: {
        organizationId,
        ...(input.status ? { status: input.status } : {}),
        ...(input.purchaseOrderId ? { purchaseOrderId: input.purchaseOrderId } : {}),
        ...(input.carrierName ? { carrierName: { equals: input.carrierName, mode: "insensitive" } } : {}),
      },
      include: shipmentInclude,
      orderBy: [{ estimatedArrivalAt: "asc" }, { createdAt: "desc" }, { id: "desc" }],
      take: input.pageSize + 1,
    });
  }

  public async create(organizationId: string, input: CreateShipmentInput): Promise<ShipmentRecord | null> {
    const purchaseOrder = await this.database.purchaseOrder.findFirst({
      where: { id: input.purchaseOrderId, organizationId, status: { in: ["issued", "partially_fulfilled"] } },
      select: { id: true },
    });
    if (!purchaseOrder) return null;
    const publicCode =
      input.publicCode ??
      `SH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return this.database.shipment.create({
      data: {
        organizationId,
        purchaseOrderId: input.purchaseOrderId,
        publicCode,
        ...(input.carrierName !== undefined ? { carrierName: input.carrierName } : {}),
        ...(input.trackingNumber !== undefined ? { trackingNumber: input.trackingNumber } : {}),
        ...(input.transportMode !== undefined ? { transportMode: input.transportMode } : {}),
        ...(input.estimatedArrivalAt !== undefined ? { estimatedArrivalAt: input.estimatedArrivalAt } : {}),
      },
      include: shipmentInclude,
    });
  }

  public async updatePlan(shipment: ShipmentRecord, input: UpdateShipmentInput): Promise<ShipmentRecord | null> {
    const updated = await this.database.shipment.updateMany({
      where: { id: shipment.id, organizationId: shipment.organizationId, status: "planned", rowVersion: input.rowVersion },
      data: {
        ...(input.carrierName !== undefined ? { carrierName: input.carrierName } : {}),
        ...(input.trackingNumber !== undefined ? { trackingNumber: input.trackingNumber } : {}),
        ...(input.transportMode !== undefined ? { transportMode: input.transportMode } : {}),
        ...(input.estimatedArrivalAt !== undefined ? { estimatedArrivalAt: input.estimatedArrivalAt } : {}),
        rowVersion: { increment: 1 },
      },
    });
    if (!updated.count) return null;
    return this.findById(shipment.organizationId, shipment.id);
  }
}
