import type { Request, RequestHandler, Response } from "express";

import {
  containerSchema, createShipmentSchema, deliveryConfirmationSchema, documentSchema, inspectionSchema,
  listShipmentsSchema, milestoneSchema, shipmentCommandSchema, shipmentIdSchema, trackingSchema, updateShipmentSchema,
} from "./shipment-schemas.js";
import type { ShipmentService } from "../application/shipment-service.js";

export class ShipmentController {
  public constructor(private readonly service: ShipmentService) {}

  public readonly create: RequestHandler = async (request, response, next) => {
    try { response.status(201).json({ data: serialize(await this.service.create(auth(request), createShipmentSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const input = listShipmentsSchema.parse(request.query);
      const shipments = await this.service.list(auth(request), input);
      const rows = shipments.slice(0, input.pageSize).flatMap((shipment) => {
        try {
          return [serialize(shipment)];
        } catch {
          return [];
        }
      });
      response.json({ data: rows, page: { hasMore: shipments.length > input.pageSize, nextCursor: null } });
    } catch (error) { next(error); }
  };
  public readonly get: RequestHandler = async (request, response, next) => {
    try { response.json({ data: serialize(await this.service.get(auth(request), id(request))) }); } catch (error) { next(error); }
  };
  public readonly update: RequestHandler = async (request, response, next) => {
    try { response.json({ data: serialize(await this.service.updatePlan(auth(request), id(request), updateShipmentSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly command: RequestHandler = async (request, response, next) => {
    try { response.json({ data: serialize(await this.service.command(auth(request), id(request), shipmentCommandSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly milestone: RequestHandler = async (request, response, next) => {
    try { response.status(201).json({ data: serialize(await this.service.addMilestone(auth(request), id(request), milestoneSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly container: RequestHandler = async (request, response, next) => {
    try { response.status(201).json({ data: serialize(await this.service.addContainer(auth(request), id(request), containerSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly tracking: RequestHandler = async (request, response, next) => {
    try { response.json({ data: serialize(await this.service.updateTracking(auth(request), id(request), trackingSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly document: RequestHandler = async (request, response, next) => {
    try { response.status(201).json({ data: serialize(await this.service.addDocument(auth(request), id(request), documentSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly evidence: RequestHandler = async (request, response, next) => {
    try { response.status(201).json({ data: serialize(await this.service.addDocument(auth(request), id(request), documentSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly inspection: RequestHandler = async (request, response, next) => {
    try { response.status(201).json({ data: serialize(await this.service.addInspection(auth(request), id(request), inspectionSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly confirmDelivery: RequestHandler = async (request, response, next) => {
    try { response.json({ data: serialize(await this.service.confirmDelivery(auth(request), id(request), deliveryConfirmationSchema.parse(request.body), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly history: RequestHandler = async (request, response, next) => {
    try {
      const rows = await this.service.history(auth(request), id(request));
      response.json({
        data: rows.map((row) => ({
          id: row.id,
          fromStatus: row.fromStatus,
          toStatus: row.toStatus,
          command: row.command,
          reason: row.reason,
          actorName: actorDisplayName(row.actor),
          createdAt: row.createdAt,
          rowVersion: row.rowVersion,
        })),
      });
    } catch (error) {
      next(error);
    }
  };
  public readonly timeline: RequestHandler = async (request, response, next) => {
    try {
      const rows = await this.service.timeline(auth(request), id(request));
      response.json({
        data: rows.map((row) => ({
          id: row.id,
          label: milestoneLabel(row.type),
          detail: row.location ? `Location: ${row.location}` : `Confidence: ${row.confidence}`,
          at: row.occurredAt ?? row.estimatedAt ?? row.createdAt,
          kind: "milestone" as const,
          type: row.type,
          confidence: row.confidence,
          location: row.location,
          occurredAt: row.occurredAt,
          estimatedAt: row.estimatedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  };
}

function id(request: Request): string { return shipmentIdSchema.parse(request.params).shipmentId; }
function auth(request: Request): NonNullable<Request["auth"]> {
  if (!request.auth) throw new Error("Authentication middleware must run before shipment controllers.");
  return request.auth;
}
function requestId(response: Response): string { return response.locals.requestId as string; }

type ActorLike = {
  displayName: string | null;
  firstName: string;
  lastName: string;
  email: string;
} | null | undefined;

function actorDisplayName(actor: ActorLike): string {
  if (!actor) return "System";
  const fullName = `${actor.firstName} ${actor.lastName}`.trim();
  return actor.displayName || fullName || actor.email;
}

function milestoneLabel(type: string): string {
  return type.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function serialize(shipment: Awaited<ReturnType<ShipmentService["get"]>>) {
  const request = shipment.purchaseOrder?.request;
  const destinationParts = [
    request?.destinationAddress,
    request?.destinationCountryCode,
  ].filter(Boolean);
  const destinationLabel = destinationParts.length
    ? destinationParts.join(", ")
    : null;
  const evidence =
    shipment.deliveryEvidence &&
    typeof shipment.deliveryEvidence === "object" &&
    !Array.isArray(shipment.deliveryEvidence)
      ? (shipment.deliveryEvidence as {
          documentIds?: string[];
          note?: string;
        })
      : null;
  const evidenceDocumentId = evidence?.documentIds?.[0] ?? null;
  const evidenceDoc = evidenceDocumentId
    ? shipment.documents.find((doc) => doc.documentId === evidenceDocumentId)
    : null;

  const milestones = shipment.milestones.map((milestone) => ({
    id: milestone.id,
    type: milestone.type,
    label: milestoneLabel(milestone.type),
    confidence: milestone.confidence,
    occurredAt: milestone.occurredAt,
    estimatedAt: milestone.estimatedAt,
    location: milestone.location,
  }));

  const timeline = [
    ...shipment.history.map((event) => ({
      id: `history-${event.id}`,
      label: `Status → ${event.toStatus.replaceAll("_", " ")}`,
      detail: event.reason ?? `Command: ${event.command}`,
      at: event.createdAt,
      kind: "status" as const,
    })),
    ...milestones.map((milestone) => ({
      id: `milestone-${milestone.id}`,
      label: milestone.label,
      detail: milestone.location
        ? `Location: ${milestone.location}`
        : `Confidence: ${milestone.confidence}`,
      at: milestone.occurredAt ?? milestone.estimatedAt ?? shipment.createdAt,
      kind: "milestone" as const,
    })),
  ].sort((left, right) => Date.parse(String(right.at)) - Date.parse(String(left.at)));

  return {
    id: shipment.id,
    purchaseOrderId: shipment.purchaseOrderId,
    purchaseOrderCode: shipment.purchaseOrder?.publicCode ?? null,
    publicCode: shipment.publicCode,
    status: shipment.status,
    carrierName: shipment.carrierName,
    trackingNumber: shipment.trackingNumber,
    transportMode: shipment.transportMode,
    estimatedArrivalAt: shipment.estimatedArrivalAt,
    actualDeliveryAt: shipment.actualDeliveryAt,
    originLabel: null,
    destinationLabel,
    recipientName: shipment.recipientName,
    confirmedAt: shipment.confirmedAt,
    rowVersion: shipment.rowVersion,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
    containers: shipment.containers,
    inspections: shipment.inspections,
    milestones,
    timeline,
    documents: shipment.documents.map((doc) => ({
      id: doc.id,
      documentId: doc.documentId,
      name: `${doc.role} · ${doc.documentId.slice(0, 8)}`,
      href: `#document-${doc.documentId}`,
      role: doc.role,
      uploadedAt: doc.createdAt,
    })),
    history: shipment.history.map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      command: event.command,
      reason: event.reason,
      actorName: actorDisplayName(event.actor),
      createdAt: event.createdAt,
    })),
    proofOfDelivery: {
      confirmed: Boolean(shipment.confirmedAt),
      recipientName: shipment.recipientName,
      confirmedAt: shipment.confirmedAt,
      confirmedByName: actorDisplayName(shipment.confirmedBy),
      notes: evidence?.note ?? null,
      evidenceHref: evidenceDoc ? `#document-${evidenceDoc.documentId}` : null,
      evidenceLabel: evidenceDoc
        ? `${evidenceDoc.role} · ${evidenceDoc.documentId.slice(0, 8)}`
        : null,
    },
    map: {
      label: destinationLabel
        ? `Destination · ${destinationLabel}`
        : `Shipment ${shipment.publicCode}`,
      region: request?.destinationCountryCode ?? null,
      latitude: null,
      longitude: null,
    },
  };
}
