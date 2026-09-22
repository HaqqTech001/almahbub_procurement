import { describe, expect, it } from "vitest";
import { masterCatalogueIdentityEvidence } from "./master-catalogue-media-identity.js";

describe("masterCatalogueIdentityEvidence", () => {
  it.each([
    ["BD MAX System", "BD", "File:Max Launch Abort System (MLAS).jpg"],
    ["Dermalux Flex MD", "Dermalux", "File:Hyundai Elantra flex 02 2016 1481.JPG"],
    ["DJI Mini 5 Pro", "DJI", "File:ASRock K7VT4A Pro Mainboard Labeled German.jpg"],
    ["Dyson Supersonic r Professional", "Dyson", "File:R Professional University Of Rehabilitation.JPG"],
    ["Kärcher K 5 Premium Smart Control Flex Home", "Kärcher", "File:Home made healthy snacks roasting rice flex.jpg"],
    ["Logitech Rally Bar", "Logitech", "File:Robert Barrable Rally Finland 2013 Surkee.JPG"],
    ["Star Micronics CD4-1616 Choice Series Cash Drawer", "Star Micronics", "File:Para Çekmecesi (Cash Drawer).jpg"],
    ["Takara Belmont Apollo 2", "Takara Belmont", "File:NASA Apollo 17 Lunar Roving Vehicle.jpg"],
  ])("rejects keyword collision for %s", (productName, manufacturer, candidateTitle) => {
    expect(masterCatalogueIdentityEvidence({ productName, manufacturer, candidateTitle }).safe).toBe(false);
  });

  it("accepts an exact branded model title", () => {
    const evidence = masterCatalogueIdentityEvidence({
      productName: "Logitech Rally Bar",
      manufacturer: "Logitech",
      candidateTitle: "Logitech Rally Bar video conferencing appliance",
    });
    expect(evidence.safe).toBe(true);
    expect(evidence.matchedManufacturerTokens).toContain("logitech");
    expect(evidence.matchedDistinctiveTokens).toContain("rally");
  });

  it("normalizes manufacturer diacritics and preserves split model codes", () => {
    const evidence = masterCatalogueIdentityEvidence({
      productName: "Kärcher K 5 Premium Smart Control Flex Home",
      manufacturer: "Kärcher",
      candidateTitle: "Karcher K 5 pressure washer",
    });
    expect(evidence.safe).toBe(true);
    expect(evidence.matchedDistinctiveTokens).toContain("k5");
  });

  it("rejects a nearby but different K-series model", () => {
    const evidence = masterCatalogueIdentityEvidence({
      productName: "Kärcher K 5 Premium Smart Control Flex Home",
      manufacturer: "Kärcher",
      candidateTitle: "Karcher K 6 pressure washer",
    });
    expect(evidence.safe).toBe(false);
  });
});
