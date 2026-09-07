import { describe, expect, it } from "vitest";

import { NotificationRepository } from "../infrastructure/notification-repository.js";

describe("notification inbox query", () => {
  it("lists by recipient rather than organisation", async () => {
    const findMany = async (args: { where: Record<string, unknown> }) => {
      expect(args.where).toMatchObject({ recipientUserId: "user-1" });
      expect(args.where).not.toHaveProperty("organizationId");
      return [];
    };
    const repository = new NotificationRepository({
      notification: { findMany },
    } as never);
    await repository.listInbox("user-1", { pageSize: 10 });
  });
});
