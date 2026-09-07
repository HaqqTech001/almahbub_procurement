import type { Prisma } from "@hamd/database";

import type {
  CreateInvoiceInput,
  ListInvoicesInput,
  UpdateInvoiceDraftInput,
} from "../api/invoice-schemas.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";

const invoiceInclude = {
  purchaseOrder: { select: { id: true, publicCode: true, status: true } },
  items: true,
  documents: true,
  allocations: { include: { payment: true } },
} as const satisfies Prisma.InvoiceInclude;

export type InvoiceRecord = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;

export class InvoiceRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public findById(organizationId: string, id: string): Promise<InvoiceRecord | null> {
    return this.database.invoice.findFirst({ where: { id, organizationId }, include: invoiceInclude });
  }

  public list(organizationId: string, input: ListInvoicesInput): Promise<InvoiceRecord[]> {
    const orderBy = { [input.sort]: input.direction } as Prisma.InvoiceOrderByWithRelationInput;
    return this.database.invoice.findMany({
      where: {
        organizationId,
        ...(input.status ? { status: input.status } : {}),
        ...(input.purchaseOrderId ? { purchaseOrderId: input.purchaseOrderId } : {}),
        ...(input.search ? { invoiceNumber: { contains: input.search, mode: "insensitive" } } : {}),
      },
      include: invoiceInclude,
      orderBy: [orderBy, { id: "desc" }],
      take: input.pageSize + 1,
    });
  }

  public async create(organizationId: string, input: CreateInvoiceInput): Promise<InvoiceRecord | null> {
    return this.database.$transaction(async (transaction) => {
      const purchaseOrder = await transaction.purchaseOrder.findFirst({
        where: { id: input.purchaseOrderId, organizationId, status: "issued" },
        select: { id: true, currencyCode: true },
      });
      if (!purchaseOrder) return null;
      const totals = calculateTotals(input);
      return transaction.invoice.create({
        data: {
          organizationId,
          purchaseOrderId: purchaseOrder.id,
          invoiceNumber: input.invoiceNumber,
          ...invoiceData(input, totals),
          items: { create: input.items.map(toItemData) },
          documents: { create: input.documentIds.map((documentId) => ({ documentId })) },
        },
        include: invoiceInclude,
      });
    });
  }

  public async updateDraft(invoice: InvoiceRecord, input: UpdateInvoiceDraftInput): Promise<InvoiceRecord | null> {
    return this.database.$transaction(async (transaction) => {
      const totals = calculateTotals(input, invoice);
      const changed = await transaction.invoice.updateMany({
        where: { id: invoice.id, organizationId: invoice.organizationId, status: "draft", rowVersion: input.rowVersion },
        data: { ...invoiceData(input, totals), rowVersion: { increment: 1 } },
      });
      if (!changed.count) return null;
      if (input.items) {
        await transaction.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
        await transaction.invoiceItem.createMany({
          data: input.items.map((entry) => ({ invoiceId: invoice.id, ...toItemData(entry) })),
        });
      }
      if (input.documentIds) {
        await transaction.invoiceDocument.deleteMany({ where: { invoiceId: invoice.id } });
        await transaction.invoiceDocument.createMany({
          data: input.documentIds.map((documentId) => ({ invoiceId: invoice.id, documentId })),
        });
      }
      return transaction.invoice.findFirst({ where: { id: invoice.id, organizationId: invoice.organizationId }, include: invoiceInclude });
    });
  }
}

function invoiceData(input: CreateInvoiceInput | UpdateInvoiceDraftInput, totals: ReturnType<typeof calculateTotals>) {
  return {
    ...(input.invoiceNumber !== undefined ? { invoiceNumber: input.invoiceNumber } : {}),
    ...(input.currencyCode !== undefined ? { currencyCode: input.currencyCode } : {}),
    ...(input.exchangeRate !== undefined ? { exchangeRate: input.exchangeRate } : {}),
    ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
    ...totals,
  };
}

function calculateTotals(input: CreateInvoiceInput | UpdateInvoiceDraftInput, existing?: InvoiceRecord) {
  const subtotal = input.items
    ? input.items.reduce((total, entry) => total + entry.quantity * entry.unitAmount, 0)
    : Number(existing?.subtotalAmount ?? 0);
  const discount = input.discountAmount ?? Number(existing?.discountAmount ?? 0);
  const tax = input.taxAmount ?? Number(existing?.taxAmount ?? 0);
  const shipping = input.shippingAmount ?? Number(existing?.shippingAmount ?? 0);
  const duty = input.dutyAmount ?? Number(existing?.dutyAmount ?? 0);
  const other = input.otherAmount ?? Number(existing?.otherAmount ?? 0);
  return { subtotalAmount: subtotal, discountAmount: discount, taxAmount: tax, shippingAmount: shipping, dutyAmount: duty, otherAmount: other, totalAmount: subtotal - discount + tax + shipping + duty + other };
}

function toItemData(item: CreateInvoiceInput["items"][number]) {
  return { purchaseOrderItemId: item.purchaseOrderItemId ?? null, description: item.description, quantity: item.quantity, unitAmount: item.unitAmount, lineAmount: item.quantity * item.unitAmount };
}
