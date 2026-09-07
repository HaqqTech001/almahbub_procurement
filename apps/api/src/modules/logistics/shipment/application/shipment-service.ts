import type { Prisma } from "@hamd/database";

import type {
  ContainerInput, CreateShipmentInput, DeliveryConfirmationInput, DocumentInput, InspectionInput,
  ListShipmentsInput, MilestoneInput, ShipmentCommandInput, TrackingInput, UpdateShipmentInput,
} from "../api/shipment-schemas.js";
import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import { publishDomainEvent } from "../../../../shared/events/domain-event-publisher.js";
import { NoopCarrierTrackingGateway, type CarrierTrackingGateway } from "./carrier-tracking-gateway.js";
import { assertOperationsUser, assertShipmentPermission, assertShipmentRead } from "./shipment-policy.js";
import { transitionShipment, type ShipmentCommand } from "../domain/shipment-state.js";
import { ShipmentRepository, type ShipmentRecord } from "../infrastructure/shipment-repository.js";

export class ShipmentService {
  private readonly repository: ShipmentRepository;

  public constructor(
    private readonly database: DatabaseClient,
    private readonly carrierTrackingGateway: CarrierTrackingGateway = new NoopCarrierTrackingGateway(),
  ) {
    this.repository = new ShipmentRepository(database);
  }

  public async create(context: AuthContext, input: CreateShipmentInput, requestId: string): Promise<ShipmentRecord> {
    assertShipmentPermission(context, "shipment:create");
    const shipment = await this.repository.create(context.organizationId, input);
    if (!shipment) throw policyViolation("Shipments may only be created for an issued purchase order in the current organization.");
    await this.record(context, shipment.id, "shipment.created", requestId);
    return shipment;
  }

  public async list(context: AuthContext, input: ListShipmentsInput): Promise<readonly ShipmentRecord[]> {
    assertShipmentRead(context);
    return this.repository.list(context.organizationId, input);
  }

  public async get(context: AuthContext, shipmentId: string): Promise<ShipmentRecord> {
    assertShipmentRead(context);
    return this.find(context.organizationId, shipmentId);
  }

  public async updatePlan(context: AuthContext, shipmentId: string, input: UpdateShipmentInput, requestId: string): Promise<ShipmentRecord> {
    assertShipmentPermission(context, "shipment:update");
    const shipment = await this.find(context.organizationId, shipmentId);
    const updated = await this.repository.updatePlan(shipment, input);
    if (!updated) throw conflict();
    await this.record(context, shipmentId, "shipment.updated", requestId);
    return updated;
  }

  public async command(context: AuthContext, shipmentId: string, input: ShipmentCommandInput, requestId: string): Promise<ShipmentRecord> {
    assertShipmentPermission(context, "shipment:manage");
    const shipment = await this.find(context.organizationId, shipmentId);
    const target = transitionShipment(shipment.status, input.command as ShipmentCommand);
    await this.database.$transaction(async (transaction) => {
      const changed = await transaction.shipment.updateMany({
        where: { id: shipment.id, organizationId: context.organizationId, status: shipment.status, rowVersion: input.rowVersion },
        data: { status: target, rowVersion: { increment: 1 } },
      });
      if (!changed.count) throw conflict();
      await transaction.shipmentHistory.create({
        data: {
          shipmentId: shipment.id, fromStatus: shipment.status, toStatus: target, command: input.command,
          ...(input.reason !== undefined ? { reason: input.reason } : {}),
          actorId: context.userId, rowVersion: input.rowVersion + 1,
        },
      });
      await materialEvents(transaction, context, shipment.id, `shipment.${input.command}`, requestId, { fromStatus: shipment.status, toStatus: target });
    });
    return this.find(context.organizationId, shipmentId);
  }

  public async addMilestone(context: AuthContext, shipmentId: string, input: MilestoneInput, requestId: string): Promise<ShipmentRecord> {
    assertShipmentPermission(context, "shipment:update");
    const shipment = await this.find(context.organizationId, shipmentId);
    await this.database.$transaction(async (transaction) => {
      await transaction.shipmentMilestone.create({
        data: {
          shipmentId: shipment.id, type: input.type, confidence: input.confidence,
          ...(input.occurredAt !== undefined ? { occurredAt: input.occurredAt } : {}),
          ...(input.estimatedAt !== undefined ? { estimatedAt: input.estimatedAt } : {}),
          ...(input.location !== undefined ? { location: input.location } : {}),
          metadata: { source: input.source, evidenceDocumentIds: input.evidenceDocumentIds },
        },
      });
      await materialEvents(transaction, context, shipment.id, "shipment.milestone_recorded", requestId, { type: input.type, source: input.source });
    });
    return this.find(context.organizationId, shipmentId);
  }

  public async addContainer(context: AuthContext, shipmentId: string, input: ContainerInput, requestId: string): Promise<ShipmentRecord> {
    assertShipmentPermission(context, "shipment:update");
    const shipment = await this.find(context.organizationId, shipmentId);
    await this.database.$transaction(async (transaction) => {
      await transaction.shipmentContainer.create({
        data: {
          shipmentId: shipment.id,
          containerNumber: input.containerNumber,
          ...(input.containerType !== undefined ? { containerType: input.containerType } : {}),
          ...(input.sealNumber !== undefined ? { sealNumber: input.sealNumber } : {}),
        },
      });
      await materialEvents(transaction, context, shipment.id, "shipment.container_added", requestId, { containerNumber: input.containerNumber });
    });
    return this.find(context.organizationId, shipmentId);
  }

  public async updateTracking(context: AuthContext, shipmentId: string, input: TrackingInput, requestId: string): Promise<ShipmentRecord> {
    assertShipmentPermission(context, "shipment:update");
    const shipment = await this.find(context.organizationId, shipmentId);
    const changed = await this.database.shipment.updateMany({
      where: { id: shipment.id, organizationId: context.organizationId, rowVersion: input.rowVersion },
      data: {
        carrierName: input.carrierName,
        trackingNumber: input.trackingNumber,
        ...(input.transportMode !== undefined ? { transportMode: input.transportMode } : {}),
        rowVersion: { increment: 1 },
      },
    });
    if (!changed.count) throw conflict();
    await this.carrierTrackingGateway.registerTracking({ shipmentId, carrierName: input.carrierName, trackingNumber: input.trackingNumber });
    await this.record(context, shipmentId, "shipment.tracking_updated", requestId);
    return this.find(context.organizationId, shipmentId);
  }

  public async addDocument(context: AuthContext, shipmentId: string, input: DocumentInput, requestId: string): Promise<ShipmentRecord> {
    assertShipmentPermission(context, "shipment:update");
    const shipment = await this.find(context.organizationId, shipmentId);
    await this.database.$transaction(async (transaction) => {
      await transaction.shipmentDocument.create({ data: { shipmentId: shipment.id, ...input } });
      await materialEvents(transaction, context, shipment.id, "shipment.document_linked", requestId, { documentId: input.documentId, role: input.role });
    });
    return this.find(context.organizationId, shipmentId);
  }

  public async addInspection(context: AuthContext, shipmentId: string, input: InspectionInput, requestId: string): Promise<ShipmentRecord> {
    assertShipmentPermission(context, "shipment:update");
    const shipment = await this.find(context.organizationId, shipmentId);
    await this.database.$transaction(async (transaction) => {
      await transaction.shipmentInspection.create({
        data: {
          shipmentId: shipment.id, status: input.status,
          ...(input.inspector !== undefined ? { inspector: input.inspector } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.inspectedAt !== undefined ? { inspectedAt: input.inspectedAt } : {}),
          evidence: { documentIds: input.evidenceDocumentIds },
        },
      });
      await materialEvents(transaction, context, shipment.id, "shipment.inspection_recorded", requestId, { status: input.status });
    });
    return this.find(context.organizationId, shipmentId);
  }

  public async confirmDelivery(context: AuthContext, shipmentId: string, input: DeliveryConfirmationInput, requestId: string): Promise<ShipmentRecord> {
    assertOperationsUser(context);
    const shipment = await this.find(context.organizationId, shipmentId);
    if (shipment.status !== "delivered") throw policyViolation("Only a delivered shipment with proof may be confirmed.");
    await this.database.$transaction(async (transaction) => {
      const changed = await transaction.shipment.updateMany({
        where: { id: shipment.id, organizationId: context.organizationId, status: "delivered", rowVersion: input.rowVersion },
        data: { status: "completed", actualDeliveryAt: new Date(), confirmedById: context.userId, confirmedAt: new Date(), recipientName: input.recipientName, deliveryEvidence: { documentIds: input.evidenceDocumentIds, note: input.note }, rowVersion: { increment: 1 } },
      });
      if (!changed.count) throw conflict();
      await transaction.shipmentMilestone.create({
        data: {
          shipmentId: shipment.id, type: "delivery_confirmed", confidence: "confirmed", occurredAt: new Date(),
          metadata: { source: "operations_confirmation", actorId: context.userId, recipientName: input.recipientName, evidenceDocumentIds: input.evidenceDocumentIds },
        },
      });
      await transaction.shipmentHistory.create({
        data: { shipmentId: shipment.id, fromStatus: "delivered", toStatus: "completed", command: "confirm_delivery", actorId: context.userId, rowVersion: input.rowVersion + 1, metadata: { recipientName: input.recipientName, evidenceDocumentIds: input.evidenceDocumentIds } },
      });
      await materialEvents(transaction, context, shipment.id, "shipment.delivery_confirmed", requestId, { evidenceCount: input.evidenceDocumentIds.length });
    });
    return this.find(context.organizationId, shipmentId);
  }

  public async history(context: AuthContext, shipmentId: string) {
    await this.get(context, shipmentId);
    return this.database.shipmentHistory.findMany({
      where: { shipmentId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        actor: {
          select: {
            displayName: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  public async timeline(context: AuthContext, shipmentId: string) {
    await this.get(context, shipmentId);
    return this.database.shipmentMilestone.findMany({
      where: { shipmentId },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    });
  }

  private async record(context: AuthContext, shipmentId: string, action: string, requestId: string): Promise<void> {
    await this.database.$transaction(async (transaction) => {
      const shipment = await transaction.shipment.findFirstOrThrow({ where: { id: shipmentId, organizationId: context.organizationId }, select: { status: true, rowVersion: true } });
      await transaction.shipmentHistory.create({ data: { shipmentId, toStatus: shipment.status, command: action.replace("shipment.", ""), actorId: context.userId, rowVersion: shipment.rowVersion } });
      await materialEvents(transaction, context, shipmentId, action, requestId);
    });
  }

  private async find(organizationId: string, shipmentId: string): Promise<ShipmentRecord> {
    return (await this.repository.findById(organizationId, shipmentId)) ?? notFound();
  }
}

async function materialEvents(transaction: Prisma.TransactionClient, context: AuthContext, shipmentId: string, action: string, requestId: string, metadata?: object): Promise<void> {
  await transaction.auditEvent.create({ data: { organizationId: context.organizationId, actorId: context.userId, action, resourceType: "shipment", resourceId: shipmentId, requestId, ...(metadata ? { metadata } : {}) } });
  if (action === "shipment.created" || action === "shipment.deliver" || action === "shipment.delivery_confirmed") {
    await publishDomainEvent(transaction, {
      name: action === "shipment.created" ? "logistics.shipment_created" : "logistics.shipment_delivered",
      organizationId: context.organizationId, aggregate: { type: "shipment", id: shipmentId },
      actor: { type: "user", id: context.userId }, correlationId: requestId,
      payload: { shipmentId, actorId: context.userId, recipientUserId: context.userId, ...metadata },
      legacyEventType: action,
    });
    return;
  }
  await transaction.outboxEvent.create({ data: { organizationId: context.organizationId, aggregateType: "shipment", aggregateId: shipmentId, eventType: action, payload: { shipmentId, actorId: context.userId, ...metadata } } });
}
function notFound(): never { throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Shipment not found." }); }
function conflict(): AppError { return new AppError({ statusCode: 409, code: "CONFLICT", message: "The shipment changed. Refresh and try again." }); }
function policyViolation(message: string): AppError { return new AppError({ statusCode: 409, code: "POLICY_VIOLATION", message }); }
