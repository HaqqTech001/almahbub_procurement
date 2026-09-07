import { describe, expect, it } from "vitest";

import {
  DEFAULT_BUYER_PERMISSIONS,
  DEFAULT_OPS_PERMISSIONS,
} from "./permission-catalog.js";

const BUYER_FORBIDDEN = [
  "ops:access",
  "cms:manage",
  "communication:manage",
  "communication:publish",
  "request:manage",
  "request:assign",
  "audit:read",
  "quotation:review",
  "quotation:issue",
  "quotation:approve",
  "quotation:create",
  "quotation:update",
  "quotation:revise",
  "invoice:create",
  "invoice:update",
  "invoice:issue",
  "invoice:void",
  "payment:create",
  "payment:submit",
  "payment:confirm",
  "shipment:create",
  "shipment:update",
  "shipment:manage",
  "shipment:confirm",
  "notification:manage",
  "guidance:manage",
] as const;

describe("permission catalog defaults", () => {
  it("does not grant ops or administrative keys to public buyer registration", () => {
    for (const key of BUYER_FORBIDDEN) {
      expect(DEFAULT_BUYER_PERMISSIONS).not.toContain(key);
    }
  });

  it("still lets buyers read their own commercial records", () => {
    expect(DEFAULT_BUYER_PERMISSIONS).toEqual(
      expect.arrayContaining([
        "request:read",
        "request:create",
        "request:archive",
        "quotation:read",
        "invoice:read",
        "payment:read",
        "shipment:read",
        "notification:read",
      ]),
    );
  });

  it("gives operations admins ops:access, template admin, and buyer capabilities", () => {
    expect(DEFAULT_OPS_PERMISSIONS).toContain("ops:access");
    expect(DEFAULT_OPS_PERMISSIONS).toContain("request:manage");
    expect(DEFAULT_OPS_PERMISSIONS).toContain("cms:manage");
    expect(DEFAULT_OPS_PERMISSIONS).toContain("communication:manage");
    expect(DEFAULT_OPS_PERMISSIONS).toContain("communication:publish");
    expect(DEFAULT_OPS_PERMISSIONS).toContain("audit:read");
    for (const key of DEFAULT_BUYER_PERMISSIONS) {
      expect(DEFAULT_OPS_PERMISSIONS).toContain(key);
    }
  });
});
