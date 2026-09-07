import { describe, expect, it } from "vitest";

import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../../../identity/auth/domain/permission-catalog.js";
import {
  assertQuotationCommandPermission,
  assertQuotationRead,
} from "../application/quotation-policy.js";

const BUYER_ID = "buyer-owner";
const OTHER_ID = "other-user";

function context(
  permissions: readonly string[],
  userId = BUYER_ID,
): AuthContext {
  return {
    userId,
    organizationId: "org-1",
    membershipId: "mem-1",
    sessionId: "sess-1",
    permissionKeys: new Set(permissions),
  };
}

describe("quotation command authorization", () => {
  it("lets a buyer read quotations without quotation:review", () => {
    expect(() =>
      assertQuotationRead(context(DEFAULT_BUYER_PERMISSIONS)),
    ).not.toThrow();
    expect(DEFAULT_BUYER_PERMISSIONS).not.toContain("quotation:review");
  });

  it("lets the request owner accept or decline without quotation:review", () => {
    const buyer = context(DEFAULT_BUYER_PERMISSIONS);
    expect(() =>
      assertQuotationCommandPermission(buyer, "accept", BUYER_ID),
    ).not.toThrow();
    expect(() =>
      assertQuotationCommandPermission(buyer, "decline", BUYER_ID),
    ).not.toThrow();
  });

  it("forbids a buyer from deciding another company's request", () => {
    const buyer = context(DEFAULT_BUYER_PERMISSIONS, OTHER_ID);
    expect(() =>
      assertQuotationCommandPermission(buyer, "accept", BUYER_ID),
    ).toThrow(AppError);
  });

  it("forbids buyers from internal review or issue", () => {
    const buyer = context(DEFAULT_BUYER_PERMISSIONS);
    try {
      assertQuotationCommandPermission(buyer, "review", BUYER_ID);
      throw new Error("expected review to fail");
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
    }
    try {
      assertQuotationCommandPermission(buyer, "issue", BUYER_ID);
      throw new Error("expected issue to fail");
    } catch (error) {
      expect(error).toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
    }
  });

  it("lets ops review/issue without being the requester", () => {
    const ops = context(
      ["quotation:review", "quotation:issue", "quotation:approve"],
      "ops-user",
    );
    expect(() =>
      assertQuotationCommandPermission(ops, "review", BUYER_ID),
    ).not.toThrow();
    expect(() =>
      assertQuotationCommandPermission(ops, "issue", BUYER_ID),
    ).not.toThrow();
    expect(() =>
      assertQuotationCommandPermission(ops, "accept", BUYER_ID),
    ).not.toThrow();
  });
});
