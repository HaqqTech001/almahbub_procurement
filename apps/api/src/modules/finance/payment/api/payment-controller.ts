import type { RequestHandler, Response } from "express";

import { createPaymentSchema, listPaymentsSchema, paymentIdSchema, rowVersionSchema } from "./payment-schemas.js";
import type { PaymentService } from "../application/payment-service.js";
import { AppError } from "../../../../lib/app-error.js";

export class PaymentController {
  public constructor(private readonly service: PaymentService) {}

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const idempotencyKey = request.header("Idempotency-Key");
      if (!idempotencyKey || idempotencyKey.length > 200) {
        throw new AppError({ statusCode: 422, code: "VALIDATION_ERROR", message: "A valid Idempotency-Key header is required." });
      }
      const payment = await this.service.create(requireAuth(request), createPaymentSchema.parse(request.body), idempotencyKey, correlationId(response));
      response.status(201).json({ data: serialize(payment) });
    } catch (error) { next(error); }
  };

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const input = listPaymentsSchema.parse(request.query);
      const payments = await this.service.list(requireAuth(request), input);
      response.json({ data: payments.slice(0, input.pageSize).map(serialize), page: { hasMore: payments.length > input.pageSize, nextCursor: null } });
    } catch (error) { next(error); }
  };

  public readonly get: RequestHandler = async (request, response, next) => {
    try { response.json({ data: serialize(await this.service.get(requireAuth(request), paymentIdSchema.parse(request.params).paymentId)) }); } catch (error) { next(error); }
  };

  public readonly submit: RequestHandler = async (request, response, next) => {
    try {
      const payment = await this.service.submit(requireAuth(request), paymentIdSchema.parse(request.params).paymentId, rowVersionSchema.parse(request.body).rowVersion, correlationId(response));
      response.json({ data: serialize(payment) });
    } catch (error) { next(error); }
  };

  public readonly confirm: RequestHandler = async (request, response, next) => {
    try {
      const payment = await this.service.confirm(requireAuth(request), paymentIdSchema.parse(request.params).paymentId, rowVersionSchema.parse(request.body).rowVersion, correlationId(response));
      response.json({ data: serialize(payment) });
    } catch (error) { next(error); }
  };

  public readonly history: RequestHandler = async (request, response, next) => {
    try { response.json({ data: await this.service.history(requireAuth(request), paymentIdSchema.parse(request.params).paymentId) }); } catch (error) { next(error); }
  };
}

function requireAuth(request: Express.Request): NonNullable<Express.Request["auth"]> {
  if (!request.auth) throw new Error("Authentication middleware must run before payment controllers.");
  return request.auth;
}
function correlationId(response: Response): string { return response.locals.requestId as string; }
function serialize(payment: Awaited<ReturnType<PaymentService["get"]>>) {
  return {
    id: payment.id, status: payment.status, method: payment.method, currencyCode: payment.currencyCode,
    amount: payment.amount.toString(), evidence: payment.evidence, providerReference: payment.providerReference,
    createdById: payment.createdById, confirmedById: payment.confirmedById, confirmedAt: payment.confirmedAt,
    rowVersion: payment.rowVersion, createdAt: payment.createdAt, updatedAt: payment.updatedAt,
    allocations: payment.allocations.map((allocation) => ({
      invoiceId: allocation.invoiceId, invoiceNumber: allocation.invoice.invoiceNumber,
      allocatedAmount: allocation.allocatedAmount.toString(),
    })),
  };
}
