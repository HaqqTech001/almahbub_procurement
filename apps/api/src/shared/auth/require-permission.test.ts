import type { Request } from "express";
import { describe, expect, it, vi } from "vitest";

import {
  requireAnyPermission,
  requirePermission,
} from "./require-permission.js";

function mockRequest(permissions: string[] | null): Request {
  return {
    auth: permissions
      ? {
          userId: "u",
          organizationId: "o",
          membershipId: "m",
          sessionId: "s",
          permissionKeys: new Set(permissions),
        }
      : undefined,
  } as unknown as Request;
}

describe("requirePermission / requireAnyPermission", () => {
  it("rejects unauthenticated callers", () => {
    const next = vi.fn();
    requirePermission("ops:access")(mockRequest(null), {} as never, next);
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      statusCode: 401,
      code: "UNAUTHENTICATED",
    });
  });

  it("rejects missing permissions", () => {
    const next = vi.fn();
    requirePermission("ops:access")(
      mockRequest(["request:read"]),
      {} as never,
      next,
    );
    expect(next.mock.calls[0]?.[0]).toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("allows any matching permission", () => {
    const next = vi.fn();
    requireAnyPermission(["ops:access", "request:manage"])(
      mockRequest(["request:manage"]),
      {} as never,
      next,
    );
    expect(next).toHaveBeenCalledWith();
  });
});
