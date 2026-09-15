import { describe, expect, it } from "vitest";

import { homepageHeader } from "../content/homepage.js";
import { IE_PATHS } from "../integrated-export/ie-paths.js";
import { buildAuthenticatedPublicHeaderLinks } from "./use-public-header-props.js";

const guestLinks = homepageHeader.links ?? [];

describe("authenticated public header links", () => {
  it("shows both operations to guests", () => {
    const links = buildAuthenticatedPublicHeaderLinks(guestLinks, false);
    expect(links.some((link) => link.href === IE_PATHS.home)).toBe(true);
    expect(links.find((link) => link.id === "home")?.href).toBe("/");
    expect(links.map((link) => link.id)).toEqual(guestLinks.map((link) => link.id));
  });

  it("inserts Almahbub Integrated Export after Products once the buyer is signed in", () => {
    const links = buildAuthenticatedPublicHeaderLinks(guestLinks, true);
    const ie = links.find((link) => link.id === "integrated-export");
    expect(ie?.href).toBe("/businesses/almahbub-integrated-export");
    expect(ie?.label).toBe("Integrated Export");
    const productsIndex = links.findIndex((link) => link.id === "products");
    expect(links[productsIndex + 1]?.id).toBe("integrated-export");
    expect(links.filter((link) => link.href === IE_PATHS.home)).toHaveLength(1);
    expect(links.find((link) => link.id === "home")?.href).toBe("/app");
    expect(links.find((link) => link.id === "home")?.label).toBe("Dashboard");
  });

  it("does not duplicate an existing Integrated Export href", () => {
    const withIe = [
      ...guestLinks,
      { id: "integrated-export", label: "Almahbub Integrated Export", href: IE_PATHS.home },
    ];
    const links = buildAuthenticatedPublicHeaderLinks(withIe, true);
    expect(links.filter((link) => link.href === IE_PATHS.home)).toHaveLength(1);
  });
});
