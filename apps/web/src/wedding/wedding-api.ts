import {
  DEFAULT_WEDDING_CAMPAIGN,
  WEDDING_GALLERY_MAX_BYTES,
  validateWeddingGalleryFile,
  type WeddingCampaignRecord,
  type WeddingWaitingTrack,
} from "@hamd/constants";
import { readResponseBody, unwrapEnvelopeData } from "@hamd/ui/auth";

import { browserApiBase } from "../lib/api-origin.js";
import { getAccessToken } from "../auth/session/token-store.js";

function apiUrl(path: string): string {
  const base = browserApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}/api/v1${normalized}` : `/api/v1${normalized}`;
}

async function weddingFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
  const body = await readResponseBody(response);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error?: { message?: string } }).error?.message ?? "Request failed.")
        : "Request failed.";
    throw new Error(message);
  }
  return unwrapEnvelopeData<T>(body);
}

export async function fetchWeddingCampaign(): Promise<WeddingCampaignRecord> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const row = await weddingFetch<WeddingCampaignRecord>("/wedding/campaign");
      return { ...DEFAULT_WEDDING_CAMPAIGN, ...row };
    } catch (error) {
      lastError = error;
    }
  }
  void lastError;
  return DEFAULT_WEDDING_CAMPAIGN;
}

export type WeddingCommentDto = {
  id: string;
  displayName: string;
  message: string;
  createdAt: string;
};

export async function listWeddingComments(channel?: "test" | "production"): Promise<WeddingCommentDto[]> {
  const query = channel ? `?channel=${channel}` : "";
  const payload = await weddingFetch<{ items?: WeddingCommentDto[] } | WeddingCommentDto[]>(
    `/wedding/comments${query}`,
  );
  if (Array.isArray(payload)) return payload;
  return payload.items ?? [];
}

export async function postWeddingComment(message: string): Promise<WeddingCommentDto> {
  return weddingFetch<WeddingCommentDto>("/wedding/comments", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export type WeddingLiveToken = {
  url: string;
  serverUrl?: string;
  token: string;
  role: "host" | "viewer";
  room: string;
};

export async function fetchWeddingLiveStatus(): Promise<{ configured: boolean }> {
  return weddingFetch<{ configured: boolean }>("/wedding/live/status");
}

export async function fetchWeddingLiveToken(
  role: "host" | "viewer",
  mode?: "test" | "production",
): Promise<WeddingLiveToken> {
  return weddingFetch<WeddingLiveToken>("/wedding/live/token", {
    method: "POST",
    body: JSON.stringify({ role, ...(mode ? { mode } : {}) }),
  });
}

export async function listWeddingWaitingAudio(): Promise<WeddingWaitingTrack[]> {
  const payload = await weddingFetch<{ items?: WeddingWaitingTrack[] }>("/wedding/waiting-audio");
  return (payload.items ?? []).map((row) => ({
    ...row,
    caption: row.caption ?? "",
    storageKey: row.storageKey ?? "",
    mimeType: row.mimeType ?? "audio/mpeg",
    fileSize: row.fileSize ?? 0,
    durationSeconds: row.durationSeconds ?? null,
    position: row.position ?? row.sortOrder ?? 0,
    isEnabled: row.isEnabled ?? row.enabled ?? true,
    weddingCampaignId: row.weddingCampaignId ?? DEFAULT_WEDDING_CAMPAIGN.id,
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
    sortOrder: row.position ?? row.sortOrder ?? 0,
    enabled: row.isEnabled ?? row.enabled ?? true,
  }));
}

export type WeddingGalleryItemDto = {
  id: string;
  kind: "image" | "video";
  src: string;
  title: string;
  caption: string;
  featured: boolean;
  downloadable: boolean;
  sortOrder: number;
};

export async function listWeddingGallery(): Promise<WeddingGalleryItemDto[]> {
  const payload = await weddingFetch<{ items?: WeddingGalleryItemDto[] } | WeddingGalleryItemDto[]>(
    "/wedding/gallery",
  );
  if (Array.isArray(payload)) return payload;
  return payload.items ?? [];
}

export function assertWeddingGalleryFile(file: File): string | null {
  return validateWeddingGalleryFile(file);
}

export { WEDDING_GALLERY_MAX_BYTES };
