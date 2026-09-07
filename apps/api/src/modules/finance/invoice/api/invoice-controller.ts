import type { RequestHandler, Response } from "express";

import {
  createInvoiceSchema, invoiceIdSchema, issueInvoiceSchema, listInvoicesSchema,
  updateInvoiceDraftSchema, voidInvoiceSchema,
} from "./invoice-schemas.js";
import type { InvoiceService } from "../application/invoice-service.js";

export class InvoiceController {
  public constructor(private readonly service: InvoiceService) {}

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const invoice = await this.service.create(requireAuth(request), createInvoiceSchema.parse(request.body), correlationId(response));
      response.status(201).json({ data: serialize(invoice) });
    } catch (error) { next(error); }
  };

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const input = listInvoicesSchema.parse(request.query);
      const invoices = await this.service.list(requireAuth(request), input);
      response.json({ data: invoices.slice(0, input.pageSize).map(serialize), page: { hasMore: invoices.length > input.pageSize, nextCursor: null } });
    } catch (error) { next(error); }
  };

  public readonly get: RequestHandler = async (request, response, next) => {
    try {
      const invoice = await this.service.get(requireAuth(request), invoiceIdSchema.parse(request.params).invoiceId);
      response.json({ data: serialize(invoice) });
    } catch (error) { next(error); }
  };

  public readonly update: RequestHandler = async (request, response, next) => {
    try {
      const invoice = await this.service.updateDraft(requireAuth(request), invoiceIdSchema.parse(request.params).invoiceId, updateInvoiceDraftSchema.parse(request.body), correlationId(response));
      response.json({ data: serialize(invoice) });
    } catch (error) { next(error); }
  };

  public readonly issue: RequestHandler = async (request, response, next) => {
    try {
      const invoice = await this.service.issue(requireAuth(request), invoiceIdSchema.parse(request.params).invoiceId, issueInvoiceSchema.parse(request.body).rowVersion, correlationId(response));
      response.json({ data: serialize(invoice) });
    } catch (error) { next(error); }
  };

  public readonly void: RequestHandler = async (request, response, next) => {
    try {
      const input = voidInvoiceSchema.parse(request.body);
      const invoice = await this.service.void(requireAuth(request), invoiceIdSchema.parse(request.params).invoiceId, input.rowVersion, input.reason, correlationId(response));
      response.json({ data: serialize(invoice) });
    } catch (error) { next(error); }
  };

  public readonly history: RequestHandler = async (request, response, next) => {
    try {
      const history = await this.service.history(requireAuth(request), invoiceIdSchema.parse(request.params).invoiceId);
      response.json({ data: history });
    } catch (error) { next(error); }
  };
}

function requireAuth(request: Express.Request): NonNullable<Express.Request["auth"]> {
  if (!request.auth) throw new Error("Authentication middleware must run before invoice controllers.");
  return request.auth;
}
function correlationId(response: Response): string { return response.locals.requestId as string; }
function amount(value: { toString(): string }): string { return value.toString(); }
function serialize(invoice: Awaited<ReturnType<InvoiceService["get"]>>) {
  const allocatedAmount = invoice.allocations.reduce((total, allocation) => total + Number(allocation.allocatedAmount), 0);
  return {
    id: invoice.id, purchaseOrderId: invoice.purchaseOrderId, purchaseOrderCode: invoice.purchaseOrder.publicCode,
    invoiceNumber: invoice.invoiceNumber, status: invoice.status, currencyCode: invoice.currencyCode,
    exchangeRate: invoice.exchangeRate?.toString() ?? null, subtotalAmount: amount(invoice.subtotalAmount),
    discountAmount: amount(invoice.discountAmount), taxAmount: amount(invoice.taxAmount), shippingAmount: amount(invoice.shippingAmount),
    dutyAmount: amount(invoice.dutyAmount), otherAmount: amount(invoice.otherAmount), totalAmount: amount(invoice.totalAmount),
    allocatedAmount: allocatedAmount.toFixed(2), outstandingAmount: (Number(invoice.totalAmount) - allocatedAmount).toFixed(2),
    dueAt: invoice.dueAt, issuedAt: invoice.issuedAt, voidedAt: invoice.voidedAt, voidReason: invoice.voidReason,
    rowVersion: invoice.rowVersion, createdAt: invoice.createdAt, updatedAt: invoice.updatedAt,
    items: invoice.items.map((item) => ({ id: item.id, purchaseOrderItemId: item.purchaseOrderItemId, description: item.description, quantity: amount(item.quantity), unitAmount: amount(item.unitAmount), lineAmount: amount(item.lineAmount) })),
    documentIds: invoice.documents.map((document) => document.documentId),
    paymentAllocations: invoice.allocations.map((allocation) => ({ paymentId: allocation.paymentId, paymentStatus: allocation.payment.status, allocatedAmount: amount(allocation.allocatedAmount), createdAt: allocation.createdAt })),
  };
}
