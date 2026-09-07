import { randomUUID } from "node:crypto";

import type {
  Prisma,
  ProcurementRequest,
  ProcurementRequestStatus,
} from "@hamd/database";

import type {
  CreateProcurementRequestInput,
  ListProcurementRequestsInput,
  UpdateProcurementRequestInput,
} from "../api/procurement-request-schemas.js";
import {
  procurementRequestLobWhere,
  type ProcurementRequestLobValue,
} from "../domain/procurement-request-lob.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";

const relatedInclude = {
  quotations: {
    select: {
      id: true,
      publicCode: true,
      status: true,
      versionNumber: true,
      rowVersion: true,
      totalAmount: true,
      currencyCode: true,
      expiresAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" as const },
    take: 12,
  },
  purchaseOrders: {
    select: {
      id: true,
      publicCode: true,
      status: true,
      totalAmount: true,
      currencyCode: true,
      updatedAt: true,
      shipments: {
        select: {
          id: true,
          publicCode: true,
          status: true,
          carrierName: true,
          trackingNumber: true,
          estimatedArrivalAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" as const },
        take: 12,
      },
      invoices: {
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          totalAmount: true,
          currencyCode: true,
          dueAt: true,
          updatedAt: true,
          allocations: {
            select: {
              payment: {
                select: {
                  id: true,
                  status: true,
                  amount: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" as const },
        take: 12,
      },
    },
    orderBy: { updatedAt: "desc" as const },
    take: 12,
  },
} as const;

const requestInclude = {
  items: true,
  requester: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
  organization: {
    select: {
      id: true,
      displayName: true,
      legalName: true,
    },
  },
  assignments: {
    where: { unassignedAt: null },
    include: {
      membership: {
        select: {
          userId: true,
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  },
  documents: {
    include: { document: true },
    orderBy: { createdAt: "asc" as const },
  },
  statusEvents: {
    orderBy: { createdAt: "asc" as const },
    take: 40,
    include: {
      actor: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  },
  ...relatedInclude,
} as const satisfies Prisma.ProcurementRequestInclude;

export type ProcurementRequestRecord = Prisma.ProcurementRequestGetPayload<{
  include: typeof requestInclude;
}>;

export class ProcurementRequestRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public async create(
    organizationId: string,
    requesterId: string,
    input: CreateProcurementRequestInput,
  ): Promise<ProcurementRequestRecord> {
    const publicCode = `PR-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;

    return this.database.procurementRequest.create({
      data: {
        organizationId,
        requesterId,
        publicCode,
        lob: input.lob,
        title: input.title,
        currencyCode: input.currencyCode,
        notes: input.notes ?? null,
        destinationCountryCode: input.destinationCountryCode ?? null,
        destinationAddress: input.destinationAddress ?? null,
        requiredByDate: input.requiredByDate ?? null,
        budgetAmount: input.budgetAmount ?? null,
        priority: input.priority,
        restrictedGoodsDeclared: input.restrictedGoodsDeclared,
        items: {
          create: input.items.map((item) => ({
            productVariantId: item.productVariantId ?? null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            targetUnitAmount: item.targetUnitAmount ?? null,
          })),
        },
        ...(input.documentIds.length > 0
          ? {
              documents: {
                create: input.documentIds.map((documentId) => ({ documentId })),
              },
            }
          : {}),
      },
      include: requestInclude,
    });
  }

  public async findById(
    organizationId: string | null,
    id: string,
    includeArchived = false,
    lob?: ProcurementRequestLobValue,
  ): Promise<ProcurementRequestRecord | null> {
    return this.database.procurementRequest.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
        ...(includeArchived ? {} : { deletedAt: null }),
        ...(lob ? { lob } : {}),
      },
      include: requestInclude,
    });
  }

  public async list(
    organizationId: string | null,
    input: ListProcurementRequestsInput & {
      retainCancelledAfterBuyerHide?: boolean;
    },
  ): Promise<readonly ProcurementRequestRecord[]> {
    const visibility: Prisma.ProcurementRequestWhereInput = input.includeArchived
      ? {}
      : input.retainCancelledAfterBuyerHide
        ? { OR: [{ deletedAt: null }, { status: "cancelled" }] }
        : { deletedAt: null };
    const search: Prisma.ProcurementRequestWhereInput | undefined = input.q
      ? {
          OR: [
            { title: { contains: input.q, mode: "insensitive" } },
            { publicCode: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : undefined;
    const where: Prisma.ProcurementRequestWhereInput = {
      ...(organizationId ? { organizationId } : {}),
      ...procurementRequestLobWhere(input.lob),
      ...(input.status ? { status: input.status } : {}),
      ...(input.ownerId ? { requesterId: input.ownerId } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      AND: [visibility, ...(search ? [search] : [])],
    };

    return this.database.procurementRequest.findMany({
      where,
      include: requestInclude,
      orderBy:
        input.sort === "createdAt"
          ? [{ createdAt: "asc" }, { id: "asc" }]
          : input.sort === "-createdAt"
            ? [{ createdAt: "desc" }, { id: "desc" }]
            : input.sort === "requiredByDate"
              ? [{ requiredByDate: "asc" }, { id: "asc" }]
              : [{ requiredByDate: "desc" }, { id: "desc" }],
      take: input.pageSize + 1,
    });
  }

  public async updateDraft(
    request: ProcurementRequest,
    input: UpdateProcurementRequestInput,
  ): Promise<ProcurementRequestRecord | null> {
    const updated = await this.database.procurementRequest.updateMany({
      where: {
        id: request.id,
        organizationId: request.organizationId,
        status: request.status,
        deletedAt: null,
        rowVersion: input.rowVersion,
      },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.currencyCode !== undefined
          ? { currencyCode: input.currencyCode }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.destinationCountryCode !== undefined
          ? { destinationCountryCode: input.destinationCountryCode }
          : {}),
        ...(input.destinationAddress !== undefined
          ? { destinationAddress: input.destinationAddress }
          : {}),
        ...(input.requiredByDate !== undefined
          ? { requiredByDate: input.requiredByDate }
          : {}),
        ...(input.budgetAmount !== undefined
          ? { budgetAmount: input.budgetAmount }
          : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.restrictedGoodsDeclared !== undefined
          ? { restrictedGoodsDeclared: input.restrictedGoodsDeclared }
          : {}),
        rowVersion: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      return null;
    }

    if (input.items) {
      await this.database.procurementRequestItem.deleteMany({
        where: { procurementRequestId: request.id },
      });
      await this.database.procurementRequestItem.createMany({
        data: input.items.map((item) => ({
          procurementRequestId: request.id,
          productVariantId: item.productVariantId ?? null,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          targetUnitAmount: item.targetUnitAmount ?? null,
        })),
      });
    }

    if (input.documentIds) {
      await this.database.procurementRequestDocument.deleteMany({
        where: { procurementRequestId: request.id },
      });
      if (input.documentIds.length > 0) {
        await this.database.procurementRequestDocument.createMany({
          data: input.documentIds.map((documentId) => ({
            procurementRequestId: request.id,
            documentId,
          })),
        });
      }
    }

    return this.findById(request.organizationId, request.id);
  }

  public async transition(
    request: ProcurementRequest,
    expectedVersion: number,
    status: ProcurementRequestStatus,
  ): Promise<ProcurementRequest | null> {
    const updated = await this.database.procurementRequest.updateMany({
      where: {
        id: request.id,
        organizationId: request.organizationId,
        status: request.status,
        rowVersion: expectedVersion,
        deletedAt: null,
      },
      data: { status, rowVersion: { increment: 1 } },
    });

    if (updated.count === 0) {
      return null;
    }

    return this.database.procurementRequest.findUnique({
      where: { id: request.id },
    });
  }
}
