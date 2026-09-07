import type { IeMarket } from "./types.js";

/**
 * Owner-approved Integrated Export market destination records.
 *
 * Intentionally empty: no verified IE destination countries exist in the repo.
 * Do not add UK, USA, UAE, EU member states, or any other invented coverage here.
 *
 * When owner-approved markets exist, add them as published (or draft) entries only.
 * This array is the single local source of truth for IE public market views until
 * a dedicated Market API/DB is approved.
 */
export const IE_MARKET_RECORDS: readonly IeMarket[] = [];
