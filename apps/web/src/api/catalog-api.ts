import { browserApiBase } from "../lib/api-origin.js";
import { BROWSER_REQUEST_TIMEOUT_MS, fetchWithTransientRetry, isAbortError, signalWithTimeout } from "@hamd/ui/auth";

export type PublicCatalogImage = {
  url: string;
  altText: string | null;
  position: number;
};

export type PublicCatalogVideo = {
  url: string;
  title: string | null;
  caption: string | null;
  position: number;
};

export type PublicCatalogCategory = {
  slug: string;
  name: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
};

export type PublicCatalogVariant = {
  name: string;
  unit: string | null;
  typicalSpecificationFields: string[];
  sourcingStatus: string | null;
};

export type PublicCatalogProduct = {
  slug: string;
  name: string;
  description: string | null;
  category: PublicCatalogCategory | null;
  brandName: string | null;
  manufacturerName: string | null;
  images: PublicCatalogImage[];
  videos: PublicCatalogVideo[];
  variants: PublicCatalogVariant[];
};

export type CatalogPageMeta = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type CatalogListResult<T> = {
  data: T[];
  page: CatalogPageMeta;
};

export class CatalogApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "CATALOG_ERROR") {
    super(message);
    this.name = "CatalogApiError";
    this.status = status;
    this.code = code;
  }
}

export type ListPublicProductsQuery = {
  category?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: "newest" | "name";
};

function apiBase(): string {
  return browserApiBase();
}

function apiUrl(path: string): string {
  const base = apiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return `/api/v1${normalized}`;
  return `${base}/api/v1${normalized}`;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function emptyPage(page = 1, pageSize = 12): CatalogPageMeta {
  return { page, pageSize, total: 0, hasMore: false };
}

async function catalogGet<T>(
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<{ data: T; page: CatalogPageMeta }> {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
  }
  const qs = params.toString();
  const url = qs ? `${apiUrl(path)}?${qs}` : apiUrl(path);
  let response: Response;
  try {
    response = await fetchWithTransientRetry(url, {
      headers: { Accept: "application/json" },
      credentials: "include",
      signal: signalWithTimeout(undefined, BROWSER_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new CatalogApiError(
        "We couldn't load this information.",
        0,
        "TIMEOUT",
      );
    }
    throw new CatalogApiError(
      "We couldn't load this information.",
      0,
      "NETWORK_ERROR",
    );
  }
  const body = await parseJson(response);
  const envelope = body as {
    data?: T;
    meta?: Partial<CatalogPageMeta>;
    error?: { message?: string; code?: string };
    message?: string;
  } | null;

  if (!response.ok) {
    throw new CatalogApiError(
      envelope?.error?.message ?? envelope?.message ?? "Unable to load catalogue.",
      response.status,
      envelope?.error?.code ?? "CATALOG_ERROR",
    );
  }

  return {
    data: (envelope?.data ?? body) as T,
    page: {
      page: Number(envelope?.meta?.page) || 1,
      pageSize: Number(envelope?.meta?.pageSize) || 12,
      total: Number(envelope?.meta?.total) || 0,
      hasMore: Boolean(envelope?.meta?.hasMore),
    },
  };
}

export async function listPublicProducts(
  query: ListPublicProductsQuery = {},
): Promise<CatalogListResult<PublicCatalogProduct>> {
  const result = await catalogGet<PublicCatalogProduct[]>("/products", {
    category: query.category,
    q: query.q,
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
  });
  return {
    data: (Array.isArray(result.data) ? result.data : []).map((row) => ({
      ...row,
      images: Array.isArray(row.images) ? row.images : [],
      videos: Array.isArray(row.videos) ? row.videos : [],
      variants: Array.isArray(row.variants) ? row.variants : [],
    })),
    page: result.page.total || result.data
      ? result.page
      : emptyPage(query.page, query.pageSize),
  };
}

export async function getPublicProduct(
  slug: string,
): Promise<PublicCatalogProduct> {
  const result = await catalogGet<PublicCatalogProduct>(
    `/products/${encodeURIComponent(slug)}`,
  );
  const data = result.data;
  return {
    ...data,
    images: Array.isArray(data?.images) ? data.images : [],
    videos: Array.isArray(data?.videos) ? data.videos : [],
    variants: Array.isArray(data?.variants) ? data.variants : [],
  };
}

export async function listPublicCategories(query: {
  page?: number;
  pageSize?: number;
} = {}): Promise<CatalogListResult<PublicCatalogCategory>> {
  const result = await catalogGet<PublicCatalogCategory[]>("/categories", {
    page: query.page,
    pageSize: query.pageSize ?? 50,
  });
  return {
    data: Array.isArray(result.data) ? result.data : [],
    page: result.page,
  };
}
