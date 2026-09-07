import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import { ProcurementRequestService } from "../application/procurement-request-service.js";

const ORG = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_A = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_B = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const INT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const IE_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function auth(
  userId: string,
  permissions: string[] = ["request:create", "request:read"],
): AuthContext {
  return {
    userId,
    organizationId: ORG,
    permissionKeys: new Set(permissions),
  } as AuthContext;
}

function requestRecord(overrides: Record<string, unknown>) {
  return {
    id: INT_ID,
    organizationId: ORG,
    requesterId: USER_A,
    publicCode: "PR-TEST",
    status: "draft",
    lob: "international",
    title: "Test request",
    currencyCode: "USD",
    notes: null,
    destinationCountryCode: null,
    destinationAddress: null,
    requiredByDate: null,
    budgetAmount: null,
    priority: "normal",
    restrictedGoodsDeclared: false,
    rowVersion: 0,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    requester: { id: USER_A, email: "a@example.com", firstName: "A", lastName: "Buyer" },
    organization: { id: ORG, displayName: "Org", legalName: "Org Ltd" },
    assignments: [],
    documents: [],
    statusEvents: [],
    quotations: [],
    purchaseOrders: [],
    ...overrides,
  };
}

describe("ProcurementRequestService LOB isolation", () => {
  const repository = {
    create: vi.fn(),
    list: vi.fn(),
    findById: vi.fn(),
  };

  const database = {
    auditEvent: { create: vi.fn().mockResolvedValue({}) },
    document: { findMany: vi.fn().mockResolvedValue([]) },
    procurementRequest: { create: vi.fn() },
  };

  let service: ProcurementRequestService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ProcurementRequestService(database as never);
    // @ts-expect-error test double
    service.repository = repository;
  });

  it("creates International requests with lob=international by default path", async () => {
    const created = requestRecord({ lob: "international" });
    repository.create.mockResolvedValue(created);

    const result = await service.create(
      auth(USER_A),
      {
        title: "International components",
        lob: "international",
        currencyCode: "USD",
        priority: "normal",
        restrictedGoodsDeclared: false,
        items: [{ description: "Bearing", quantity: 1, unit: "pcs" }],
        documentIds: [],
      },
      "corr-1",
    );

    expect(repository.create).toHaveBeenCalledWith(
      ORG,
      USER_A,
      expect.objectContaining({ lob: "international" }),
    );
    expect(result.lob).toBe("international");
  });

  it("creates Integrated Export requests with lob=integrated_export", async () => {
    const created = requestRecord({
      id: IE_ID,
      lob: "integrated_export",
      title: "IE agro enquiry",
    });
    repository.create.mockResolvedValue(created);

    const result = await service.create(
      auth(USER_A),
      {
        title: "IE agro enquiry",
        lob: "integrated_export",
        currencyCode: "USD",
        priority: "normal",
        restrictedGoodsDeclared: false,
        items: [{ description: "Commodity lot", quantity: 20, unit: "mt" }],
        documentIds: [],
      },
      "corr-2",
    );

    expect(repository.create).toHaveBeenCalledWith(
      ORG,
      USER_A,
      expect.objectContaining({ lob: "integrated_export" }),
    );
    expect(result.lob).toBe("integrated_export");
  });

  it("lists International without IE rows", async () => {
    repository.list.mockResolvedValue([requestRecord({ lob: "international" })]);

    await service.list(auth(USER_A), {
      pageSize: 25,
      lob: "international",
      includeArchived: false,
      sort: "-createdAt",
    });

    expect(repository.list).toHaveBeenCalledWith(
      ORG,
      expect.objectContaining({
        lob: "international",
        ownerId: USER_A,
      }),
    );
  });

  it("lists Integrated Export without International rows", async () => {
    repository.list.mockResolvedValue([
      requestRecord({ id: IE_ID, lob: "integrated_export" }),
    ]);

    await service.list(auth(USER_A), {
      pageSize: 25,
      lob: "integrated_export",
      includeArchived: false,
      sort: "-createdAt",
    });

    expect(repository.list).toHaveBeenCalledWith(
      ORG,
      expect.objectContaining({ lob: "integrated_export" }),
    );
  });

  it("rejects lob=all for buyers without request:manage", async () => {
    await expect(
      service.list(auth(USER_A), {
        pageSize: 25,
        lob: "all",
        includeArchived: false,
        sort: "-createdAt",
      }),
    ).rejects.toBeInstanceOf(AppError);
    expect(repository.list).not.toHaveBeenCalled();
  });

  it("lists every organisation's requests for operators with request:manage", async () => {
    repository.list.mockResolvedValue([requestRecord({ lob: "international" })]);
    await service.list(auth(USER_A, ["request:read", "request:manage"]), {
      pageSize: 25,
      lob: "all",
      includeArchived: false,
      sort: "-createdAt",
    });
    expect(repository.list).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        lob: "all",
        ownerId: undefined,
      }),
    );
  });

  it("lists a buyer's own requests across LOBs when lob is omitted", async () => {
    repository.list.mockResolvedValue([]);
    await service.list(auth(USER_A), {
      pageSize: 25,
      includeArchived: false,
      sort: "-createdAt",
    });
    expect(repository.list).toHaveBeenCalledWith(
      ORG,
      expect.objectContaining({
        lob: "all",
        ownerId: USER_A,
      }),
    );
  });

  it("International detail with lob filter cannot retrieve IE request", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.get(auth(USER_A), IE_ID, false, "international"),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(repository.findById).toHaveBeenCalledWith(
      ORG,
      IE_ID,
      false,
      "international",
    );
  });

  it("IE detail with lob filter cannot retrieve International request", async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.get(auth(USER_A), INT_ID, false, "integrated_export"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("buyer cannot access another buyer request", async () => {
    repository.findById.mockResolvedValue(
      requestRecord({ requesterId: USER_A, lob: "integrated_export", id: IE_ID }),
    );

    await expect(service.get(auth(USER_B), IE_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("rejects create without request:create", async () => {
    await expect(
      service.create(
        auth(USER_A, ["request:read"]),
        {
          title: "Blocked",
          lob: "integrated_export",
          currencyCode: "USD",
          priority: "normal",
          restrictedGoodsDeclared: false,
          items: [{ description: "Item", quantity: 1, unit: "pcs" }],
          documentIds: [],
        },
        "corr-3",
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
