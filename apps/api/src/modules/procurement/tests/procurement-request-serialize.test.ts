import { describe, expect, it } from "vitest";

import {
  procurementRequestAudience,
  serializeProcurementRequest,
} from "../api/procurement-request-serialize.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";

function auth(permissions: string[]): AuthContext {
  return {
    userId: "user-1",
    organizationId: "org-1",
    membershipId: "mem-1",
    sessionId: "sess-1",
    permissionKeys: new Set(permissions),
  };
}

function requestRecord() {
  return {
    id: "req-1",
    publicCode: "PR-1001",
    status: "submitted",
    lob: "international",
    title: "Valves",
    currencyCode: "USD",
    notes: "Buyer delivery note",
    destinationCountryCode: "NG",
    destinationAddress: "Lagos",
    requiredByDate: null,
    budgetAmount: null,
    priority: "high",
    restrictedGoodsDeclared: false,
    requesterId: "user-1",
    organizationId: "org-1",
    rowVersion: 1,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    archivedAt: new Date("2026-08-03T00:00:00.000Z"),
    requester: {
      id: "user-1",
      email: "ada@acme.test",
      firstName: "Ada",
      lastName: "Buyer",
    },
    organization: { id: "org-1", displayName: "Acme", legalName: "Acme Ltd" },
    assignments: [
      {
        isPrimary: true,
        membershipId: "mem-ops-1",
        membership: {
          userId: "ops-1",
          user: { firstName: "Ops", lastName: "Lead", email: "ops@almahbub.test" },
        },
      },
    ],
    statusEvents: [
      {
        id: "evt-1",
        fromStatus: "draft",
        toStatus: "submitted",
        command: "submit",
        reason: null,
        actor: { firstName: "Ops", lastName: "Lead", email: "ops@almahbub.test" },
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
      },
    ],
    items: [],
    documents: [],
    quotations: [],
    purchaseOrders: [],
    shipments: [],
    invoices: [],
    payments: [],
  } as unknown as Parameters<typeof serializeProcurementRequest>[0];
}

describe("serializeProcurementRequest", () => {
  it("treats request:manage as the ops audience", () => {
    expect(procurementRequestAudience(auth(["request:read"]))).toBe("buyer");
    expect(
      procurementRequestAudience(auth(["request:read", "request:manage"])),
    ).toBe("ops");
  });

  it("omits assignee, archive metadata, and actor names from buyer payloads", () => {
    const body = serializeProcurementRequest(requestRecord(), "buyer");
    expect(body.notes).toBe("Buyer delivery note");
    expect(body.assigneeName).toBeNull();
    expect(body.assigneeMembershipId).toBeNull();
    expect(body.archivedAt).toBeNull();
    expect(body.history[0]?.actorName).toBeNull();
  });

  it("includes assignee and actor names for ops", () => {
    const body = serializeProcurementRequest(requestRecord(), "ops");
    expect(body.requesterName).toBeTruthy();
    expect(body.ownerName).toBe(body.requesterName);
    expect(body.assigneeName).toBe("Ops Lead");
    expect(body.assigneeMembershipId).toBe("mem-ops-1");
    expect(body.archivedAt).toEqual(new Date("2026-08-03T00:00:00.000Z"));
    expect(body.history[0]?.actorName).toBe("Ops Lead");
  });
});
