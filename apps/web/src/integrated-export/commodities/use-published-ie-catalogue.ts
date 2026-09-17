import { useEffect, useMemo, useState } from "react";

import {
  getPublishedIeCommodityFromApi,
  IeCommodityApiError,
  listPublishedIeCommoditiesFromApi,
} from "./ie-commodity-api.js";
import { mapApiCommodityToIeCommodity } from "./map-ie-commodity.js";
import {
  getPublishedIeCommodityBySlug,
  listPublishedIeCommodities,
  toIeCommodityPreview,
} from "./selectors.js";
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

/**
 * Runtime catalogue: public API when available, static published records if the API fails.
 * API success (including an empty published list) replaces the static snapshot.
 */
export function usePublishedIeCommodities(): PublishedIeCatalogueState {
  const staticRecords = useMemo(() => listPublishedIeCommodities(), []);
  const [commodities, setCommodities] = useState<readonly IeCommodity[]>(staticRecords);
  const [source, setSource] = useState<IeCatalogueSource>("static");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listPublishedIeCommoditiesFromApi()
      .then((rows) => {
        if (cancelled) return;
        setCommodities(rows.map(mapApiCommodityToIeCommodity));
        setSource("api");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCommodities([]);
        setSource("api");
        setError(
          err instanceof IeCommodityApiError
            ? err.message
            : "Unable to load published commodities.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce, staticRecords]);

  return {
    commodities,
    previews: commodities.map(toIeCommodityPreview),
    source,
    loading,
    error,
    retry: () => setNonce((value) => value + 1),
  };
}

export type PublishedIeCommodityState = {
  commodity: IeCommodity | null;
  source: IeCatalogueSource;
  loading: boolean;
};

/**
 * Runtime detail: GET /commodities/:slug when available.
 * Network failures keep the static published record; HTTP 404 means unpublished/unknown.
 */
export function usePublishedIeCommodity(slug: string): PublishedIeCommodityState {
  const normalized = slug.trim().toLowerCase();
  const staticRecord = useMemo(
    () => (normalized ? getPublishedIeCommodityBySlug(normalized) : null),
    [normalized],
  );
  const [commodity, setCommodity] = useState<IeCommodity | null>(staticRecord);
  const [source, setSource] = useState<IeCatalogueSource>("static");
  const [loading, setLoading] = useState(Boolean(normalized));

  useEffect(() => {
    if (!normalized) {
      setLoading(false);
      setCommodity(null);
      setSource("static");
      return;
    }
    setCommodity(staticRecord);
    setSource("static");
    setLoading(true);
    let cancelled = false;
    void getPublishedIeCommodityFromApi(normalized)
      .then((row) => {
        if (cancelled) return;
        if (!row.published) {
          setCommodity(null);
          setSource("api");
          return;
        }
        setCommodity(mapApiCommodityToIeCommodity(row));
        setSource("api");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof IeCommodityApiError && error.status === 404) {
          setCommodity(null);
          setSource("api");
          return;
        }
        setCommodity(staticRecord);
        setSource("static");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
    };
  }, [normalized, staticRecord]);

  return { commodity, source, loading };
}
