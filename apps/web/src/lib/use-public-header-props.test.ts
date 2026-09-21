import { describe, expect, it } from "vitest";
import { publicLinks, publicServiceMenus, PROCUREMENT_HOME } from "../content/public-navigation.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";
import { buildAuthenticatedPublicHeaderLinks } from "./use-public-header-props.js";

describe("public service navigation", () => {
  it.each([false, true])("keeps Home at the umbrella landing for authenticated=%s", (authenticated) => {
    const links = buildAuthenticatedPublicHeaderLinks(publicLinks, authenticated);
    expect(links.find((link) => link.id === "home")).toEqual({ id: "home", label: "Home", href: "/" });
    expect(links.some((link) => link.href === "/app")).toBe(false);
  });
  it("exposes both service homes and actual export routes", () => {
    expect(publicServiceMenus.map((menu) => menu.href)).toEqual([PROCUREMENT_HOME, IE_PATHS.home, "/services"]);
    const exported = publicServiceMenus[1]!.columns.flatMap((column) => column.items.map((item) => item.href));
    expect(exported).toEqual([IE_PATHS.home, IE_PATHS.commodities, IE_PATHS.process, IE_PATHS.quality, IE_PATHS.markets, IE_PATHS.request]);
  });
  it("removes duplicate hrefs", () => {
    expect(buildAuthenticatedPublicHeaderLinks([...publicLinks, publicLinks[0]!], true)).toHaveLength(publicLinks.length);
  });
});
