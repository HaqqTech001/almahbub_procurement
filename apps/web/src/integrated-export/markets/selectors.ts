import { IE_MARKET_RECORDS } from "./store.js";
import type { IeMarket } from "./types.js";

export function listAllIeMarkets(): readonly IeMarket[] {
  return IE_MARKET_RECORDS;
}

export function listPublishedIeMarkets(): readonly IeMarket[] {
  return IE_MARKET_RECORDS.filter((market) => market.published).slice().sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });
}

export function getPublishedIeMarketById(id: string): IeMarket | undefined {
  return listPublishedIeMarkets().find((market) => market.id === id);
}
