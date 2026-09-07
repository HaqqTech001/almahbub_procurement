import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../lib/app-error.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import { OpsService } from "../application/ops-service.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";

const auth = {
  userId: "user-1",
  organizationId: "org-1",
  membershipId: "mem-1",
  sessionId: "sess-1",
  permissionKeys: new Set(["ops:access"]),
} as AuthContext;

describe("ops product publish rules", () => {
  it("rejects publishing without category and description", async () => {
    const database = {
      product: {
        create: vi.fn(),
        findUnique: vi.fn().mockResolvedValue(null),
      },
    } as unknown as DatabaseClient;
    const error = await new OpsService(database)
      .createProduct(auth, {
        name: "Draft only",
        status: "published",
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ statusCode: 422, code: "VALIDATION_ERROR" });
    expect(database.product.create).not.toHaveBeenCalled();
  });
});
