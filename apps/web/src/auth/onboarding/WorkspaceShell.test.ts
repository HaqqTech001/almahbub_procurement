import { describe, expect, it } from "vitest";

import { buildBuyerWorkspaceNav } from "./buyer-workspace-nav.js";

describe("buyer workspace navigation", () => {
  it("exposes authenticated Agro Produce after login", () => {
    const sections = buildBuyerWorkspaceNav("/app");
    const items = sections.flatMap((section) => section.items);
    const agro = items.find((item) => item.id === "agro-produce");
    expect(agro?.label).toBe("Agro Produce");
    expect(agro?.href).toBe("/app/agro-produce");
    expect(agro?.current).toBe(false);
    expect(items.some((item) => /admin/i.test(item.label))).toBe(false);
    expect(items.some((item) => item.id === "integrated-export")).toBe(false);
  });

  it("marks Agro Produce current on the authenticated commodity routes", () => {
    const sections = buildBuyerWorkspaceNav("/app/agro-produce/sesame-seeds");
    const agro = sections.flatMap((section) => section.items).find((item) => item.id === "agro-produce");
    expect(agro?.current).toBe(true);
  });

  it("keeps the authenticated buyer destinations and excludes admin routes", () => {
    const items = buildBuyerWorkspaceNav("/app").flatMap((section) => section.items);
    expect(items.map((item) => item.id)).toEqual([
      "dashboard",
      "requests",
      "products",
      "quotations",
      "invoices",
      "payments",
      "shipments",
      "announcements",
      "chat",
      "agro-produce",
      "profile",
      "settings",
    ]);
    expect(items.some((item) => /users|audit|faq|wedding|ops/i.test(item.label))).toBe(false);
    expect(items.some((item) => item.href.startsWith("/admin") || item.href.startsWith("/ops"))).toBe(
      false,
    );
  });
});
