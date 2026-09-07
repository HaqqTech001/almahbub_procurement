import { describe, expect, it } from "vitest";

import {
  IE_PATHS,
  IE_PRIMARY_NAV,
  isIePathActive,
  resolveIeHashPath,
} from "./ie-paths.js";

describe("IE paths", () => {
  it("keeps a stable base namespace", () => {
    expect(IE_PATHS.home).toBe("/businesses/almahbub-integrated-export");
    expect(IE_PATHS.commodities).toBe(
      "/businesses/almahbub-integrated-export/commodities",
    );
    expect(IE_PATHS.commodity("sesame")).toBe(
      "/businesses/almahbub-integrated-export/commodities/sesame",
    );
  });

  it("maps legacy hashes to multi-page routes", () => {
    expect(resolveIeHashPath("#commodities")).toBe(IE_PATHS.commodities);
    expect(resolveIeHashPath("bulk-supply")).toBe(IE_PATHS.commodities);
    expect(resolveIeHashPath("#export")).toBe(IE_PATHS.process);
    expect(resolveIeHashPath("#about")).toBe(IE_PATHS.about);
    expect(resolveIeHashPath("#contact")).toBe(IE_PATHS.contact);
    expect(resolveIeHashPath("#unknown")).toBeNull();
  });

  it("marks nested commodity routes under Commodities", () => {
    const commodities = IE_PRIMARY_NAV.find((item) => item.id === "commodities");
    expect(commodities).toBeTruthy();
    expect(
      isIePathActive(
        "/businesses/almahbub-integrated-export/commodities/sesame",
        commodities!,
      ),
    ).toBe(true);
    expect(
      isIePathActive("/businesses/almahbub-integrated-export/process", commodities!),
    ).toBe(false);
  });
});
