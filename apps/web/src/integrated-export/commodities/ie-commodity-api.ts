import { readResponseBody, toCancelledRequestError, unwrapEnvelopeData } from "@hamd/ui/auth";
import { browserApiBase } from "../../lib/api-origin.js";
import { resolveMediaUrl } from "../../lib/media-url.js";

export class IeCommodityApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "IeCommodityApiError";
    this.status = status;
  }
}

export type IeCommodityApiMedia = { src: string; alt: string; sortOrder?: number };
export type IeCommodityApiListItem = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  category: string | null;
  shortDescription: string | null;
  heroMedia: IeCommodityApiMedia | null;
  sortOrder: number;
};
export type IeCommodityApiDetail = IeCommodityApiListItem & {
  description: string | null;
  gallery: IeCommodityApiMedia[];
  specifications: Array<{ label: string; value: string }>;
  packaging: string | null;
  qualityInformation: string | null;
  applications: string[];
  markets: string | null;
};

export function resolveIeMediaSrc(src: string | null | undefined): string | undefined {
  return resolveMediaUrl(src);
}

function apiUrl(path: string): string {
  const base = browserApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}/api/v1${normalized}` : `/api/v1${normalized}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function ieFetch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
  } catch (error) {
    const cancelled = toCancelledRequestError(error);
    if (cancelled) throw cancelled;
    throw new IeCommodityApiError("Unable to load published commodities.", 0);
  }
  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new IeCommodityApiError("Unable to load published commodities.", response.status);
  }
  return unwrapEnvelopeData<T>(body);
}

export function unwrapCommodityListPayload(body: unknown): IeCommodityApiListItem[] {
  if (Array.isArray(body)) return body as IeCommodityApiListItem[];
  if (isRecord(body) && Array.isArray(body.data)) return body.data as IeCommodityApiListItem[];
  if (isRecord(body) && Array.isArray(body.items)) return body.items as IeCommodityApiListItem[];
  throw new IeCommodityApiError("Invalid commodity list payload.", 500);
}

export async function listPublishedIeCommoditiesFromApi(): Promise<IeCommodityApiListItem[]> {
  const payload = await ieFetch<unknown>(
    "/integrated-export/commodities?page=1&pageSize=100&sort=sortOrder",
  );
  return unwrapCommodityListPayload(payload).filter((row) => row.published !== false);
}

export async function getPublishedIeCommodityFromApi(slug: string): Promise<IeCommodityApiDetail> {
  return ieFetch<IeCommodityApiDetail>(
    `/integrated-export/commodities/${encodeURIComponent(slug)}`,
  );
}
