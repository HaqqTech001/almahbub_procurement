import { describe, expect, it } from "vitest";
import {
  isAuthChromePath,
  resolveTourPageKey,
} from "./ProductTourHost.js";
import {
  filterToursForRole,
  resolveProductTourRole,
  createStaticTourCatalog,
  guidanceToursFixture,
} from "@hamd/ui/guidance";

describe("product tour host helpers", () => {
  it("maps routes to page keys and skips auth chrome", () => {
    expect(resolveTourPageKey("/")).toBe("public_home");
    expect(resolveTourPageKey("/app")).toBe("dashboard");
    expect(resolveTourPageKey("/app/settings")).toBe("settings");
    expect(resolveTourPageKey("/app/profile")).toBe("settings");
    expect(resolveTourPageKey("/app/requests")).toBe("procurement_requests");
    expect(resolveTourPageKey("/app/requests/new")).toBe("request_wizard");
    expect(resolveTourPageKey("/app/quotations")).toBe("quotations");
    expect(resolveTourPageKey("/app/shipments")).toBe("shipments");
    expect(resolveTourPageKey("/app/notifications")).toBe("notifications");
    expect(resolveTourPageKey("/app/chat")).toBe("chat");
    expect(isAuthChromePath("/login")).toBe(true);
    expect(isAuthChromePath("/app")).toBe(false);
    expect(isAuthChromePath("/about")).toBe(false);
  });

  it("keeps role-aware catalogs ready for CMS swap", () => {
    expect(resolveProductTourRole({ isAuthenticated: false })).toBe(
      "public_visitor",
    );
    const catalog = createStaticTourCatalog({
      id: "test",
      tours: filterToursForRole(guidanceToursFixture, "public_visitor"),
    });
    expect(catalog.getTours().some((t) => t.key === "public_home")).toBe(true);
  });
});
