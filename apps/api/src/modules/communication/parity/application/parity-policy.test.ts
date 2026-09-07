import { describe, expect, it } from "vitest";

import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../../../identity/auth/domain/permission-catalog.js";
import { assertParityManage } from "./parity-policy.js";

function context(permissions: readonly string[]): AuthContext {
  return {
    userId: "user-1",
    organizationId: "org-1",
    membershipId: "mem-1",
    sessionId: "sess-1",
    permissionKeys: new Set(permissions),
  };
}

describe("assertParityManage", () => {
  it("rejects a buyer-default permission set", () => {
    const error = (() => {
      try {
        assertParityManage(context(DEFAULT_BUYER_PERMISSIONS));
        return null;
      } catch (caught) {
        return caught;
      }
    })();
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  it("allows ops:access", () => {
    expect(() => assertParityManage(context(["ops:access"]))).not.toThrow();
  });

  it("allows cms:manage", () => {
    expect(() => assertParityManage(context(["cms:manage"]))).not.toThrow();
  });
});
