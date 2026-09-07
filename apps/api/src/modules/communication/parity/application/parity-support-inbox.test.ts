import { describe, expect, it, vi } from "vitest";

import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import { ParityService } from "./parity-service.js";

function auth(permissions: string[], organizationId: string): AuthContext {
  return {
    userId: "11111111-1111-4111-8111-111111111111",
    organizationId,
    permissionKeys: new Set(permissions),
  } as AuthContext;
}

describe("Ops support inbox", () => {
  it("lists threads across organisations for ops:access", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "thread-buyer",
        subject: "Support",
        status: "open",
        requesterId: "buyer",
        requester: { id: "buyer", email: "buyer@example.com", firstName: "B", lastName: "Uyer" },
        messages: [{
          id: "m1",
          threadId: "thread-buyer",
          authorId: "buyer",
          body: "Need help",
          createdAt: new Date(),
          fromOps: false,
          readAt: null,
        }],
        _count: { messages: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const groupBy = vi.fn().mockResolvedValue([
      { threadId: "thread-buyer", _count: { _all: 4 } },
    ]);
    const database = {
      supportThread: { findMany },
      supportMessage: { groupBy },
    };
    const service = new ParityService(database as never, {} as never);
    const rows = await service.listOrgSupportThreads(
      auth(["ops:access"], "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
    expect(rows[0]?.lastMessage).toBeTruthy();
    expect(rows[0]?.unreadCount).toBe(4);
  });

  it("scopes threads to the caller organisation without ops:access", async () => {
    const org = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const findMany = vi.fn().mockResolvedValue([]);
    const database = {
      supportThread: { findMany },
      supportMessage: { groupBy: vi.fn().mockResolvedValue([]) },
    };
    const service = new ParityService(database as never, {} as never);
    await service.listOrgSupportThreads(auth(["cms:manage"], org));
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: org } }),
    );
  });
});
