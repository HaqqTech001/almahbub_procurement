import { describe, expect, it, vi } from "vitest";

import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import { OpsService } from "../application/ops-service.js";

const auth = {
  userId: "user-1",
  organizationId: "org-staff",
  membershipId: "mem-1",
  sessionId: "sess-1",
  permissionKeys: new Set(["ops:access"]),
} as AuthContext;

describe("ops dashboard aggregations", () => {
  it("returns platform-wide KPIs and attention without scoping to the staff org", async () => {
    const procurementRequest = {
      groupBy: vi.fn(async () => [{ status: "submitted", _count: { _all: 3 } }]),
      findMany: vi.fn(async (args: { select?: Record<string, unknown> }) => {
        if (args.select && "createdAt" in args.select && !("publicCode" in args.select)) {
          return [{ createdAt: new Date() }];
        }
        return [
          {
            id: "r1",
            publicCode: "PR-1",
            title: "Oxygen concentrators",
            status: "submitted",
            createdAt: new Date(),
            organization: { displayName: "Ada Procurement" },
            requester: { firstName: "Ada", lastName: "Buyer", email: "ada@example.com" },
          },
        ];
      }),
    };
    const quotation = {
      groupBy: vi.fn(async () => [{ status: "draft", _count: { _all: 2 } }]),
      findMany: vi.fn(async () => []),
    };
    const product = {
      groupBy: vi.fn(async () => [
        { status: "published", _count: { _all: 5 } },
        { status: "draft", _count: { _all: 1 } },
      ]),
      findMany: vi.fn(async () => []),
    };
    const shipment = {
      groupBy: vi.fn(async () => []),
      findMany: vi.fn(async () => []),
    };
    const invoice = {
      groupBy: vi.fn(async () => []),
      aggregate: vi.fn(async () => ({ _sum: { totalAmount: 0 }, _count: 0 })),
    };
    const database = {
      procurementRequest,
      quotation,
      product,
      shipment,
      invoice,
      payment: { count: vi.fn(async () => 4) },
      notification: { count: vi.fn(async () => 0) },
      announcement: { count: vi.fn(async () => 0) },
      auditEvent: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async () => 10) },
      organization: { count: vi.fn(async () => 3) },
    } as unknown as DatabaseClient;

    const result = await new OpsService(database).dashboard(auth);

    expect(procurementRequest.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } }),
    );

    expect(result.kpis.find((kpi) => kpi.id === "kpi-orders")?.value).toBe("3");
    expect(result.kpis.find((kpi) => kpi.id === "kpi-quotes")?.value).toBe("2");
    expect(result.kpis.find((kpi) => kpi.id === "kpi-published-products")?.value).toBe("5");
    expect(result.kpis.find((kpi) => kpi.id === "kpi-payments")?.value).toBe("4");
    expect(result.attention).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "attention-requests",
          count: 3,
          href: "/requests?status=submitted",
        }),
        expect.objectContaining({
          id: "attention-quotations",
          count: 2,
        }),
        expect.objectContaining({
          id: "attention-draft-products",
          count: 1,
        }),
      ]),
    );
    expect(result.requestPipeline.find((stage) => stage.id === "submitted")?.count).toBe(3);
    expect(result.catalogue).toEqual({ published: 5, draft: 1, archived: 0 });
    expect(result.requestSeries?.["7d"]?.length).toBe(7);
  });
});
