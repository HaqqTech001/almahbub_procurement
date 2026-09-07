import { OpsApiError, opsFetch, requireOpsToken } from "../lib/ops-fetch.js";

export { OpsApiError, requireOpsToken as requireIeCommodityToken };

export type IeCommodityMedia = {
  src: string;
  alt: string;
  sortOrder?: number;
};

export type IeCommoditySpec = {
  label: string;
  value: string;
};

export type IeCommodityListItem = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  category: string | null;
  shortDescription: string | null;
  heroMedia: IeCommodityMedia | null;
  sortOrder: number;
};

export type IeCommodityRow = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  heroMedia: IeCommodityMedia | null;
  gallery: IeCommodityMedia[];
  specifications: IeCommoditySpec[];
  packaging: string | null;
  qualityInformation: string | null;
  applications: string[];
  markets: string | null;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IeCommodityWriteBody = {
  name: string;
  slug: string;
  published?: boolean;
  category?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  heroMedia?: IeCommodityMedia | null;
  gallery?: IeCommodityMedia[] | null;
  specifications?: IeCommoditySpec[] | null;
  packaging?: string | null;
  qualityInformation?: string | null;
  applications?: string[] | null;
  markets?: string | null;
  sortOrder?: number;
};

export async function listIeCommodities(
  accessToken: string,
  query?: { q?: string; category?: string; includeUnpublished?: boolean },
): Promise<{ data: IeCommodityListItem[] }> {
  const result = await opsFetch<IeCommodityListItem[]>(
    "/integrated-export/commodities",
    {
      method: "GET",
      accessToken,
      query: {
        includeUnpublished: query?.includeUnpublished ? "true" : undefined,
        q: query?.q,
        category: query?.category,
        pageSize: 100,
        sort: "sortOrder",
      },
    },
  );
  return { data: Array.isArray(result) ? result : [] };
}

export async function getIeCommodity(
  accessToken: string,
  slug: string,
): Promise<IeCommodityRow> {
  return opsFetch<IeCommodityRow>(
    `/integrated-export/commodities/${encodeURIComponent(slug)}`,
    { method: "GET", accessToken },
  );
}

export async function createIeCommodity(
  accessToken: string,
  body: IeCommodityWriteBody,
): Promise<IeCommodityRow> {
  return opsFetch<IeCommodityRow>("/integrated-export/commodities", {
    method: "POST",
    accessToken,
    body,
  });
}

export async function updateIeCommodity(
  accessToken: string,
  id: string,
  body: Partial<IeCommodityWriteBody>,
): Promise<IeCommodityRow> {
  return opsFetch<IeCommodityRow>(`/integrated-export/commodities/${id}`, {
    method: "PATCH",
    accessToken,
    body,
  });
}

export async function uploadIeCommodityHero(
  accessToken: string,
  id: string,
  file: File,
): Promise<IeCommodityRow> {
  const form = new FormData();
  form.append("files", file);
  return opsFetch<IeCommodityRow>(`/integrated-export/commodities/${id}/hero`, {
    method: "POST",
    accessToken,
    form,
  });
}

export async function archiveIeCommodity(
  accessToken: string,
  id: string,
): Promise<IeCommodityRow> {
  return opsFetch<IeCommodityRow>(`/integrated-export/commodities/${id}`, {
    method: "DELETE",
    accessToken,
  });
}
