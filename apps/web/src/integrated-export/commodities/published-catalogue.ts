import type { IeCommodity } from "./types.js";

/**
 * Offline/static published IE catalogue used only when the public API is
 * unreachable. Owner-verified commodities for publication: none.
 * Do not add sesame, cashew, ginger, hibiscus, shea, soybean, cocoa, or any
 * other commodity here until it is approved and published through CMS/API.
 */
export const IE_PUBLISHED_COMMODITY_RECORDS: readonly IeCommodity[] = [];
