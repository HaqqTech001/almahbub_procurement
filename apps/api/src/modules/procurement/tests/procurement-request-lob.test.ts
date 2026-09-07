import { describe, expect, it } from "vitest";

import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import {
  DEFAULT_PROCUREMENT_REQUEST_LOB,
  procurementRequestLobWhere,
  resolveProcurementListLob,
} from "../domain/procurement-request-lob.js";

function auth(permissions: string[]): AuthContext {
  return {
    userId: "11111111-1111-4111-8111-111111111111",
    organizationId: "22222222-2222-4222-8222-222222222222",
    permissionKeys: new Set(permissions),
  } as AuthContext;
}

describe("procurement request LOB helpers", () => {
  it("defaults LOB to international", () => {
    expect(DEFAULT_PROCUREMENT_REQUEST_LOB).toBe("international");
  });

  it("builds Prisma where for each LOB filter", () => {
    expect(procurementRequestLobWhere("international")).toEqual({
      lob: "international",
    });
    expect(procurementRequestLobWhere("integrated_export")).toEqual({
      lob: "integrated_export",
    });
    expect(procurementRequestLobWhere("all")).toEqual({});
  });

  it("allows lob=all only with request:manage", () => {
    expect(
      resolveProcurementListLob(auth(["request:read", "request:manage"]), "all"),
    ).toBe("all");
    expect(() =>
      resolveProcurementListLob(auth(["request:read"]), "all"),
    ).toThrow(AppError);
  });

  it("treats omitted lob as all-lobs (owner-scoped for buyers)", () => {
    expect(resolveProcurementListLob(auth(["request:read"]), undefined)).toBe(
      "all",
    );
  });

  it("passes through explicit LOB filters for buyers", () => {
    expect(
      resolveProcurementListLob(auth(["request:read"]), "integrated_export"),
    ).toBe("integrated_export");
  });
});
