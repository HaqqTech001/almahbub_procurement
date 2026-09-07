import { randomUUID } from "node:crypto";

import type { Prisma } from "@hamd/database";

import type {
  CreateQuotationInput,
  ListQuotationsInput,
  UpdateQuotationDraftInput,
} from "../api/quotation-schemas.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";

const quotationInclude = {
  request: { select: { requesterId: true, publicCode: true } },
  supplier: {
    select: { id: true, legalName: true, countryCode: true, status: true },
  },
  items: true,
  documents: true,
  family: {
    select: {
      id: true,
      quotations: {
        select: {
          id: true,
          versionNumber: true,
          publicCode: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { versionNumber: "asc" as const },
      },
    },
  },
} as const satisfies Prisma.QuotationInclude;

export type QuotationRecord = Prisma.QuotationGetPayload<{
  include: typeof quotationInclude;
}>;

export class QuotationRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async findById(
    organizationId: string,
    id: string,
  ): Promise<QuotationRecord | null> {
    return this.database.quotation.findFirst({
      where: { id, organizationId },
      include: quotationInclude,
    });
  }

  public async list(
    organizationId: string,
    input: ListQuotationsInput,
  ): Promise<readonly QuotationRecord[]> {
    return this.database.quotation.findMany({
      where: {
        organizationId,
        ...(input.procurementRequestId
          ? { procurementRequestId: input.procurementRequestId }
          : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.supplierId ? { supplierId: input.supplierId } : {}),
        ...(input.familyId ? { familyId: input.familyId } : {}),
      },
      include: quotationInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.pageSize + 1,
    });
  }

  public async create(
    organizationId: string,
    input: CreateQuotationInput,
  ): Promise<QuotationRecord | null> {
    const totals = calculateTotals(input);
    return this.database.$transaction(async (transaction) => {
      const request = await transaction.procurementRequest.findFirst({
        where: {
          id: input.procurementRequestId,
          organizationId,
          deletedAt: null,
          status: { in: ["accepted_for_sourcing", "sourcing"] },
        },
        select: { id: true },
      });
      if (!request) return null;

      const family = await transaction.quotationFamily.create({
        data: { organizationId, procurementRequestId: request.id },
      });
      return transaction.quotation.create({
        data: {
          organizationId,
          procurementRequestId: request.id,
          familyId: family.id,
          publicCode: quotationCode(),
          ...commercialData(input, totals),
          items: { create: input.items.map(toItemData) },
          documents: {
            create: input.documentIds.map((documentId) => ({ documentId })),
          },
        },
        include: quotationInclude,
      });
    });
  }

  public async updateDraft(
    quotation: QuotationRecord,
    input: UpdateQuotationDraftInput,
  ): Promise<QuotationRecord | null> {
    const totals = calculateTotals(input, quotation);
    return this.database.$transaction(async (transaction) => {
      const changed = await transaction.quotation.updateMany({
        where: {
          id: quotation.id,
          organizationId: quotation.organizationId,
          status: "draft",
          rowVersion: input.rowVersion,
        },
        data: {
          ...commercialData(input, totals),
          rowVersion: { increment: 1 },
        },
      });
      if (!changed.count) return null;
      if (input.items) {
        await transaction.quotationItem.deleteMany({
          where: { quotationId: quotation.id },
        });
        await transaction.quotationItem.createMany({
          data: input.items.map((entry) => ({
            quotationId: quotation.id,
            ...toItemData(entry),
          })),
        });
      }
      if (input.documentIds) {
        await transaction.quotationDocument.deleteMany({
          where: { quotationId: quotation.id },
        });
        await transaction.quotationDocument.createMany({
          data: input.documentIds.map((documentId) => ({
            quotationId: quotation.id,
            documentId,
          })),
        });
      }
      return transaction.quotation.findFirst({
        where: { id: quotation.id, organizationId: quotation.organizationId },
        include: quotationInclude,
      });
    });
  }
}

function commercialData(
  input: CreateQuotationInput | UpdateQuotationDraftInput,
  totals: ReturnType<typeof calculateTotals>,
) {
  return {
    ...(input.supplierId !== undefined ? { supplierId: input.supplierId } : {}),
    ...(input.currencyCode !== undefined ? { currencyCode: input.currencyCode } : {}),
    ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    ...(input.deliveryLeadTimeDays !== undefined
      ? { deliveryLeadTimeDays: input.deliveryLeadTimeDays }
      : {}),
    ...(input.minimumOrderQuantity !== undefined
      ? { minimumOrderQuantity: input.minimumOrderQuantity }
      : {}),
    ...(input.paymentTerms !== undefined ? { paymentTerms: input.paymentTerms } : {}),
    ...(input.commercialTerms !== undefined
      ? { commercialTerms: input.commercialTerms }
      : {}),
    ...totals,
  };
}

function calculateTotals(
  input: CreateQuotationInput | UpdateQuotationDraftInput,
  existing?: QuotationRecord,
) {
  const subtotal =
    input.subtotalAmount ??
    (input.items
      ? input.items.reduce((total, entry) => total + entry.quantity * entry.unitAmount, 0)
      : Number(existing?.subtotalAmount ?? 0));
  const discount = input.discountAmount ?? Number(existing?.discountAmount ?? 0);
  const tax = input.taxAmount ?? Number(existing?.taxAmount ?? 0);
  const shipping = input.shippingAmount ?? Number(existing?.shippingAmount ?? 0);
  const duty = input.dutyAmount ?? Number(existing?.dutyAmount ?? 0);
  const other = input.otherAmount ?? Number(existing?.otherAmount ?? 0);
  return {
    subtotalAmount: subtotal,
    discountAmount: discount,
    taxAmount: tax,
    shippingAmount: shipping,
    dutyAmount: duty,
    otherAmount: other,
    totalAmount: subtotal - discount + tax + shipping + duty + other,
  };
}

function toItemData(item: CreateQuotationInput["items"][number]) {
  return {
    procurementRequestItemId: item.procurementRequestItemId ?? null,
    productVariantId: item.productVariantId ?? null,
    description: item.description,
    quantity: item.quantity,
    unitAmount: item.unitAmount,
    lineAmount: item.quantity * item.unitAmount,
  };
}

function quotationCode(): string {
  return `QT-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}
