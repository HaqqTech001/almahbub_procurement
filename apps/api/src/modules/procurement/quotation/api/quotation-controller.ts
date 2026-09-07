import type { RequestHandler, Response } from "express";

import {
  createQuotationSchema,
  listQuotationsSchema,
  quotationCommandSchema,
  quotationIdSchema,
  reviseQuotationSchema,
  updateQuotationDraftSchema,
} from "./quotation-schemas.js";
import type { QuotationService } from "../application/quotation-service.js";

export class QuotationController {
  public constructor(private readonly service: QuotationService) {}

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const quotation = await this.service.create(
        requireAuth(request),
        createQuotationSchema.parse(request.body),
        correlationId(response),
      );
      response.status(201).json({ data: serialize(quotation) });
    } catch (error) {
      next(error);
    }
  };

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const input = listQuotationsSchema.parse(request.query);
      const quotations = await this.service.list(requireAuth(request), input);
      const rows = quotations.slice(0, input.pageSize).flatMap((quotation) => {
        try {
          return [serialize(quotation)];
        } catch {
          return [];
        }
      });
      response.json({
        data: rows,
        page: { hasMore: quotations.length > input.pageSize, nextCursor: null },
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly get: RequestHandler = async (request, response, next) => {
    try {
      const { quotationId } = quotationIdSchema.parse(request.params);
      response.json({
        data: serialize(await this.service.get(requireAuth(request), quotationId)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateDraft: RequestHandler = async (request, response, next) => {
    try {
      const { quotationId } = quotationIdSchema.parse(request.params);
      const quotation = await this.service.updateDraft(
        requireAuth(request),
        quotationId,
        updateQuotationDraftSchema.parse(request.body),
        correlationId(response),
      );
      response.json({ data: serialize(quotation) });
    } catch (error) {
      next(error);
    }
  };

  public readonly transition: RequestHandler = async (request, response, next) => {
    try {
      const { quotationId } = quotationIdSchema.parse(request.params);
      const input = quotationCommandSchema.parse(request.body);
      const quotation = await this.service.transition(
        requireAuth(request),
        quotationId,
        input.command,
        input.rowVersion,
        input.reason,
        correlationId(response),
      );
      response.json({ data: serialize(quotation) });
    } catch (error) {
      next(error);
    }
  };

  public readonly revise: RequestHandler = async (request, response, next) => {
    try {
      const { quotationId } = quotationIdSchema.parse(request.params);
      const input = reviseQuotationSchema.parse(request.body);
      const quotation = await this.service.revise(
        requireAuth(request),
        quotationId,
        input.rowVersion,
        input.reason,
        correlationId(response),
      );
      response.status(201).json({ data: serialize(quotation) });
    } catch (error) {
      next(error);
    }
  };

  public readonly history: RequestHandler = async (request, response, next) => {
    try {
      const { quotationId } = quotationIdSchema.parse(request.params);
      const rows = await this.service.history(
        requireAuth(request),
        quotationId,
      );
      response.json({
        data: rows.map((row) => ({
          id: row.id,
          fromStatus: row.fromStatus,
          toStatus: row.toStatus,
          command: row.command,
          reason: row.reason,
          actorName:
            row.actor.displayName ??
            `${row.actor.firstName} ${row.actor.lastName}`.trim() ??
            row.actor.email,
          createdAt: row.createdAt,
          rowVersion: row.rowVersion,
        })),
      });
    } catch (error) {
      next(error);
    }
  };
}

function requireAuth(request: Express.Request): NonNullable<Express.Request["auth"]> {
  if (!request.auth) throw new Error("Authentication middleware must run first.");
  return request.auth;
}

function correlationId(response: Response): string {
  return response.locals.requestId as string;
}

function serialize(quotation: Awaited<ReturnType<QuotationService["get"]>>) {
  const versions = quotation.family.quotations.map((version) => ({
    id: version.id,
    versionNumber: version.versionNumber,
    publicCode: version.publicCode,
    status: version.status,
    totalAmount: version.totalAmount.toString(),
    createdAt: version.createdAt,
    current: version.id === quotation.id,
  }));

  return {
    id: quotation.id,
    familyId: quotation.familyId,
    supersedesId: quotation.supersedesId,
    versionNumber: quotation.versionNumber,
    publicCode: quotation.publicCode,
    procurementRequestId: quotation.procurementRequestId,
    procurementRequestCode: quotation.request.publicCode,
    supplierId: quotation.supplierId,
    supplierName: quotation.supplier?.legalName ?? null,
    supplierCountryCode: quotation.supplier?.countryCode ?? null,
    supplierStatus: quotation.supplier?.status ?? null,
    status: quotation.status,
    currencyCode: quotation.currencyCode,
    price: {
      subtotalAmount: quotation.subtotalAmount.toString(),
      discountAmount: quotation.discountAmount.toString(),
      taxAmount: quotation.taxAmount.toString(),
      shippingAmount: quotation.shippingAmount.toString(),
      dutyAmount: quotation.dutyAmount.toString(),
      otherAmount: quotation.otherAmount.toString(),
      totalAmount: quotation.totalAmount.toString(),
    },
    expiresAt: quotation.expiresAt,
    deliveryLeadTimeDays: quotation.deliveryLeadTimeDays,
    minimumOrderQuantity: quotation.minimumOrderQuantity?.toString() ?? null,
    paymentTerms: quotation.paymentTerms,
    commercialTerms: quotation.commercialTerms,
    rowVersion: quotation.rowVersion,
    documentIds: quotation.documents.map((document) => document.documentId),
    attachments: quotation.documents.map((document) => ({
      id: document.id,
      documentId: document.documentId,
      name: `Attachment ${document.documentId.slice(0, 8)}`,
      href: `/api/v1/documents/${document.documentId}`,
      kind: "document",
      uploadedAt: document.createdAt,
    })),
    versions,
    items: quotation.items.map((item) => ({
      id: item.id,
      procurementRequestItemId: item.procurementRequestItemId,
      productVariantId: item.productVariantId,
      description: item.description,
      quantity: item.quantity.toString(),
      unitAmount: item.unitAmount.toString(),
      lineAmount: item.lineAmount.toString(),
    })),
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
  };
}
