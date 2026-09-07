import { describe, expect, it } from "vitest";

import { ADMIN_NAV_SECTIONS, filterAdminNav } from "./admin-nav.js";

describe("admin navigation", () => {
  it("omits fake fixture modules", () => {
    const labels = ADMIN_NAV_SECTIONS.flatMap((section) =>
      section.items.map((item) => item.label),
    );
    expect(labels).toContain("Users");
    expect(labels).toContain("Organisations");
    expect(labels).toContain("Invoices");
    expect(labels).toContain("Audit Log");
    expect(labels).toContain("Export commodities");
    expect(labels).toContain("Notifications");
    expect(labels).toContain("Wedding Campaign");
    expect(labels).toContain("Chat");
    expect(labels).not.toContain("Support");
    expect(labels).not.toContain("Inventory");
    expect(labels).not.toContain("Analytics");
    expect(labels).not.toContain("Purchase Orders");
    expect(labels).not.toContain("Settings");
  });

  it("hides AI Assistant without guidance:manage", () => {
    const filtered = filterAdminNav(ADMIN_NAV_SECTIONS, ["ops:access"]);
    const labels = filtered.flatMap((section) => section.items.map((item) => item.label));
    expect(labels).toContain("Notifications");
    expect(labels).not.toContain("AI Assistant");
    expect(labels).not.toContain("Guidance Admin");
    expect(labels).not.toContain("Audit Log");
  });

  it("shows audit when audit:read is present", () => {
    const filtered = filterAdminNav(ADMIN_NAV_SECTIONS, ["ops:access", "audit:read"]);
    const labels = filtered.flatMap((section) => section.items.map((item) => item.label));
    expect(labels).toContain("Audit Log");
  });
});
