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

  it("exposes the public catalogue as unauthenticated read-only routes", () => {
    expect(findRoutePolicy("GET", "/api/v1/products")).toMatchObject({
      access: "public",
    });
    expect(findRoutePolicy("GET", "/api/v1/products/:slug")).toMatchObject({
      access: "public",
    });
    expect(findRoutePolicy("GET", "/api/v1/categories")).toMatchObject({
      access: "public",
    });
    expect(
      findRoutePolicy("GET", "/api/v1/public/catalog-media/:productId/:filename"),
    ).toMatchObject({
      access: "public",
    });
  });

  it("requires ops:access for operations catalogue management", () => {
    expect(findRoutePolicy("GET", "/api/v1/ops/dashboard")).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
    expect(findRoutePolicy("GET", "/api/v1/ops/audit-events")).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
    expect(findRoutePolicy("GET", "/api/v1/ops/identity")).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
    expect(
      findRoutePolicy("PATCH", "/api/v1/ops/identity/users/:userId/status"),
    ).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
    expect(
      findRoutePolicy("PATCH", "/api/v1/ops/identity/users/:userId/ops-access"),
    ).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
    expect(
      findRoutePolicy("POST", "/api/v1/ops/products/:id/images/upload"),
    ).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
    expect(findRoutePolicy("PATCH", "/api/v1/ops/categories/:id")).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
  });

  it("keeps announcement administration off the public catalogue", () => {
    expect(findRoutePolicy("GET", "/api/v1/announcements")).toMatchObject({
      access: "public",
    });
    expect(findRoutePolicy("GET", "/api/v1/announcements/admin")).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
    expect(findRoutePolicy("POST", "/api/v1/announcements")).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
    expect(
      findRoutePolicy("POST", "/api/v1/announcements/:id/media"),
    ).toMatchObject({
      access: "authenticated",
      permission: "ops:access",
    });
    expect(
      findRoutePolicy("GET", "/api/v1/announcements/:id/media/:mediaId"),
    ).toMatchObject({
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
    const transitions = findRoutePolicy(
      "POST",
      "/api/v1/procurement-requests/:requestId/transitions",
    );
    expect(transitions).toMatchObject({ access: "authenticated" });
    expect(transitions?.permission).toBeUndefined();
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
    const transitions = findRoutePolicy(
      "POST",
      "/api/v1/quotations/:quotationId/transitions",
    );
    expect(transitions).toMatchObject({ access: "authenticated" });
    expect(transitions?.permission).toBeUndefined();
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
