import { describe, expect, it } from "vitest";

import { findRoutePolicy, routePolicies } from "../src/routes/route-policy.js";

describe("route policy registry", () => {
  it("makes the baseline operational routes explicitly public", () => {
    expect(findRoutePolicy("get", "/health/live")).toMatchObject({
      access: "public",
    });
    expect(findRoutePolicy("GET", "/openapi.json")).toMatchObject({
      access: "public",
    });
  });

  it("does not contain duplicate method and path pairs", () => {
    const keys = routePolicies.map(
      (policy) => `${policy.method} ${policy.path}`,
    );

    expect(new Set(keys)).toHaveLength(keys.length);
  });

  it("requires explicit authenticated policies for Procurement Request endpoints", () => {
    expect(
      findRoutePolicy("POST", "/api/v1/procurement-requests"),
    ).toMatchObject({
      access: "authenticated",
      permission: "request:create",
    });
    expect(
      findRoutePolicy(
        "POST",
        "/api/v1/procurement-requests/:requestId/transitions",
      ),
    ).toMatchObject({
      access: "authenticated",
      permission: "request:manage",
    });
  });

  it("registers governed quotation endpoints", () => {
    expect(findRoutePolicy("POST", "/api/v1/quotations")).toMatchObject({
      access: "authenticated",
      permission: "quotation:create",
    });
    expect(
      findRoutePolicy("POST", "/api/v1/quotations/:quotationId/revise"),
    ).toMatchObject({
      access: "authenticated",
      permission: "quotation:revise",
    });
  });

  it("registers governed document upload endpoints", () => {
    expect(findRoutePolicy("POST", "/api/v1/documents")).toMatchObject({
      access: "authenticated",
      permission: "request:create",
    });
    expect(
      findRoutePolicy("GET", "/api/v1/documents/:documentId"),
    ).toMatchObject({
      access: "authenticated",
      permission: "request:read",
    });
  });

  it("registers governed auth recovery and session endpoints", () => {
    expect(findRoutePolicy("POST", "/api/v1/auth/register")).toMatchObject({
      access: "public",
    });
    expect(findRoutePolicy("POST", "/api/v1/auth/forgot-password")).toMatchObject({
      access: "public",
    });
    expect(findRoutePolicy("POST", "/api/v1/auth/logout-everywhere")).toMatchObject({
      access: "authenticated",
    });
    expect(findRoutePolicy("GET", "/api/v1/auth/sessions")).toMatchObject({
      access: "authenticated",
    });
    expect(findRoutePolicy("GET", "/api/v1/auth/invitations/:token")).toMatchObject({
      access: "public",
    });
  });
});
