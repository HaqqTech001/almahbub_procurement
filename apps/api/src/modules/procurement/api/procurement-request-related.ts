type MoneyLike = { toString(): string } | string | number | null | undefined;

function money(value: MoneyLike): string | null {
  if (value == null || value === "") return null;
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : value.toString();
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

export type RelatedQuotationDto = {
  id: string;
  publicCode: string;
  status: string;
  versionNumber?: number | null;
  rowVersion?: number | null;
  totalAmount: string | null;
  currencyCode: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
};

export type RelatedPurchaseOrderDto = {
  id: string;
  publicCode: string;
  status: string;
  totalAmount: string | null;
  currencyCode: string | null;
  updatedAt: string | null;
};

export type RelatedShipmentDto = {
  id: string;
  publicCode: string;
  status: string;
  carrierName: string | null;
  trackingNumber: string | null;
  estimatedArrivalAt: string | null;
  purchaseOrderId: string;
  updatedAt: string | null;
};

export type RelatedInvoiceDto = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: string | null;
  currencyCode: string | null;
  dueAt: string | null;
  purchaseOrderId: string;
  updatedAt: string | null;
};

export type RelatedPaymentDto = {
  id: string;
  status: string;
  amount: string | null;
  invoiceId: string | null;
  updatedAt: string | null;
};

export type RequestRelatedDto = {
  quotations: RelatedQuotationDto[];
  purchaseOrders: RelatedPurchaseOrderDto[];
  shipments: RelatedShipmentDto[];
  invoices: RelatedInvoiceDto[];
  payments: RelatedPaymentDto[];
};

export type RelatedSource = {
  quotations?: ReadonlyArray<{
    id: string;
    publicCode: string;
    status: string;
    versionNumber?: number | null;
    rowVersion?: number | null;
    totalAmount?: MoneyLike;
    currencyCode?: string | null;
    expiresAt?: Date | string | null;
    updatedAt?: Date | string | null;
  }>;
  purchaseOrders?: ReadonlyArray<{
    id: string;
    publicCode: string;
    status: string;
    totalAmount?: MoneyLike;
    currencyCode?: string | null;
    updatedAt?: Date | string | null;
    shipments?: ReadonlyArray<{
      id: string;
      publicCode: string;
      status: string;
      carrierName?: string | null;
      trackingNumber?: string | null;
      estimatedArrivalAt?: Date | string | null;
      updatedAt?: Date | string | null;
    }>;
    invoices?: ReadonlyArray<{
      id: string;
      invoiceNumber: string;
      status: string;
      totalAmount?: MoneyLike;
      currencyCode?: string | null;
      dueAt?: Date | string | null;
      updatedAt?: Date | string | null;
      allocations?: ReadonlyArray<{
        payment?: {
          id: string;
          status: string;
          amount?: MoneyLike;
          updatedAt?: Date | string | null;
        } | null;
      }>;
    }>;
  }>;
};

export function emptyRequestRelated(): RequestRelatedDto {
  return {
    quotations: [],
    purchaseOrders: [],
    shipments: [],
    invoices: [],
    payments: [],
  };
}

/** Read-only projection of Prisma relations already on a procurement request. */
export function serializeRequestRelated(
  source: RelatedSource | null | undefined,
): RequestRelatedDto {
  if (!source) return emptyRequestRelated();

  const quotations = (source.quotations ?? []).map((row) => ({
    id: row.id,
    publicCode: row.publicCode,
    status: row.status,
    versionNumber: row.versionNumber ?? null,
    rowVersion: row.rowVersion ?? null,
    totalAmount: money(row.totalAmount),
    currencyCode: row.currencyCode ?? null,
    expiresAt: iso(row.expiresAt),
    updatedAt: iso(row.updatedAt),
  }));

  const purchaseOrders = (source.purchaseOrders ?? []).map((row) => ({
    id: row.id,
    publicCode: row.publicCode,
    status: row.status,
    totalAmount: money(row.totalAmount),
    currencyCode: row.currencyCode ?? null,
    updatedAt: iso(row.updatedAt),
  }));

  const shipments: RelatedShipmentDto[] = [];
  const invoices: RelatedInvoiceDto[] = [];
  const payments: RelatedPaymentDto[] = [];
  const seenPayments = new Set<string>();

  for (const order of source.purchaseOrders ?? []) {
    for (const shipment of order.shipments ?? []) {
      shipments.push({
        id: shipment.id,
        publicCode: shipment.publicCode,
        status: shipment.status,
        carrierName: shipment.carrierName ?? null,
        trackingNumber: shipment.trackingNumber ?? null,
        estimatedArrivalAt: iso(shipment.estimatedArrivalAt),
        purchaseOrderId: order.id,
        updatedAt: iso(shipment.updatedAt),
      });
    }
    for (const invoice of order.invoices ?? []) {
      invoices.push({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        totalAmount: money(invoice.totalAmount),
        currencyCode: invoice.currencyCode ?? null,
        dueAt: iso(invoice.dueAt),
        purchaseOrderId: order.id,
        updatedAt: iso(invoice.updatedAt),
      });
      for (const allocation of invoice.allocations ?? []) {
        const payment = allocation.payment;
        if (!payment || seenPayments.has(payment.id)) continue;
        seenPayments.add(payment.id);
        payments.push({
          id: payment.id,
          status: payment.status,
          amount: money(payment.amount),
          invoiceId: invoice.id,
          updatedAt: iso(payment.updatedAt),
        });
      }
    }
  }

  return { quotations, purchaseOrders, shipments, invoices, payments };
}

export function scopeProcurementListOwner(
  canManage: boolean,
  actorUserId: string,
  requestedOwnerId?: string,
): string | undefined {
  if (!canManage) return actorUserId;
  return requestedOwnerId;
}
