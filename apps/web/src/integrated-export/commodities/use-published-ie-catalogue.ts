import { useEffect, useState } from "react";
import {
  getPublishedIeCommodityFromApi,
  listPublishedIeCommoditiesFromApi,
} from "./ie-commodity-api.js";
import { mapApiCommodityToIeCommodity } from "./map-ie-commodity.js";
import { toIeCommodityPreview } from "./selectors.js";
import type { IeCommodity, IeCommodityPreview } from "./types.js";
export type IeCatalogueSource = "api" | "static";
export type PublishedIeCatalogueState = {
  commodities: readonly IeCommodity[];
  previews: readonly IeCommodityPreview[];
  source: IeCatalogueSource;
  loading: boolean;
  error: string | null;
  retry: () => void;
};
/** Publication is authoritative in the API. Never render static draft/fallback records. */
export function usePublishedIeCommodities(): PublishedIeCatalogueState {
  const [commodities, setCommodities] = useState<readonly IeCommodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void listPublishedIeCommoditiesFromApi()
      .then((rows) => {
        if (active) setCommodities(rows.map(mapApiCommodityToIeCommodity));
      })
      .catch(() => {
        if (active) {
          setCommodities([]);
          setError("Unable to load published commodities.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [nonce]);
  return {
    commodities,
    previews: commodities.map(toIeCommodityPreview),
    source: "api",
    loading,
    error,
    retry: () => setNonce((value) => value + 1),
  };
}
export type PublishedIeCommodityState = {
  commodity: IeCommodity | null;
  source: IeCatalogueSource;
  loading: boolean;
  error: string | null;
};
export function usePublishedIeCommodity(
  slug: string,
): PublishedIeCommodityState {
  const normalized = slug.trim().toLowerCase();
  const [result, setResult] = useState<{
    slug: string;
    commodity: IeCommodity | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    let active = true;
    setResult(null);
    if (!normalized) return;
    void getPublishedIeCommodityFromApi(normalized)
      .then((row) => {
        if (active)
          setResult({
            slug: normalized,
            commodity:
              row.published && row.slug === normalized
                ? mapApiCommodityToIeCommodity(row)
                : null,
            error: null,
          });
      })
      .catch(() => {
        if (active)
          setResult({
            slug: normalized,
            commodity: null,
            error: "Commodity details could not be loaded.",
          });
      });
    return () => {
      active = false;
    };
  }, [normalized]);
  const current = result?.slug === normalized ? result : null;
  return {
    commodity: current?.commodity ?? null,
    source: "api",
    loading: Boolean(normalized) && !current,
    error: current?.error ?? null,
  };
}
