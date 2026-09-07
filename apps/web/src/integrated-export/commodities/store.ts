import { IE_PUBLISHED_COMMODITY_RECORDS } from "./published-catalogue.js";
import type { IeCommodity } from "./types.js";

/**
 * Public Integrated Export commodity catalogue (buyer host).
 *
 * Runtime pages prefer GET /api/v1/integrated-export/commodities.
 * This static snapshot is empty until owner-verified records are published
 * through the CMS/API workflow. It is not a parallel catalogue.
 */
export const IE_COMMODITY_RECORDS: readonly IeCommodity[] =
  IE_PUBLISHED_COMMODITY_RECORDS;
