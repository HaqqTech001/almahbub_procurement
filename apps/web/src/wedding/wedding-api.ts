import { userFacingError } from "@hamd/ui/auth";
import {
  DEFAULT_WEDDING_CAMPAIGN,
  WEDDING_GALLERY_MAX_BYTES,
  validateWeddingGalleryFile,
  type WeddingCampaignRecord,
  type WeddingWaitingTrack,
} from "@hamd/constants";
import { BROWSER_REQUEST_TIMEOUT_MS, fetchWithTransientRetry, readResponseBody, signalWithTimeout, unwrapEnvelopeData } from "@hamd/ui/auth";

import { browserApiBase } from "../lib/api-origin.js";
import { resolveMediaUrl } from "../lib/media-url.js";
import { sessionFetch } from "../auth/session/session-http.js";
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
  const publicRead = (!init.method || init.method === "GET") && ["/wedding/comments", "/wedding/gallery", "/wedding/waiting-audio", "/wedding/live/status"].includes(path);
  const response = await (publicRead ? fetchWithTransientRetry : sessionFetch)(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(userFacingError({ ...body as object, status: response.status }));
  }
  return unwrapEnvelopeData<T>(body);
}

export async function fetchWeddingCampaign(): Promise<WeddingCampaignRecord> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      // Campaign promotion is public. Session initialization must not turn a
      // later anonymous refresh into an authenticated request and disable it.
      const response = await fetchWithTransientRetry(apiUrl("/wedding/campaign"), {
        headers: { Accept: "application/json" },
        credentials: "include",
        signal: signalWithTimeout(undefined, BROWSER_REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error("Unable to load the public wedding campaign.");
      const row = unwrapEnvelopeData<WeddingCampaignRecord>(await readResponseBody(response));
      if (!row || typeof row.modalEnabled !== "boolean") throw new Error("Invalid wedding campaign response.");
      const serverDate = response.headers.get("Date");
      const serverNow = serverDate ? Date.parse(serverDate) : Number.NaN;
      return {
        ...DEFAULT_WEDDING_CAMPAIGN,
        ...row,
        serverNow: Number.isFinite(serverNow) ? new Date(serverNow).toISOString() : undefined,
      } as WeddingCampaignRecord & { serverNow?: string };

    } catch (error) {
      lastError = error;
    }
  }
  void lastError;
  return { ...DEFAULT_WEDDING_CAMPAIGN, modalEnabled: false };
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
    src: resolveMediaUrl(row.src) ?? row.src,
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
  return (Array.isArray(payload) ? payload : payload.items ?? []).map((row) => ({
    ...row, src: resolveMediaUrl(row.src) ?? row.src,
  }));
}

export type WeddingParticipationState = { subscribed: boolean; joined: boolean };
export async function fetchWeddingParticipation(): Promise<WeddingParticipationState> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { return await weddingFetch<WeddingParticipationState>("/wedding/participation"); }
    catch (error) { lastError = error; if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 250 : 750)); }
  }
  throw lastError instanceof Error ? lastError : new Error("Unable to load wedding preferences.");
}
export const changeWeddingSubscription = (enabled: boolean) => weddingFetch<WeddingParticipationState>(
  "/wedding/subscription", { method: "PUT", body: JSON.stringify({ enabled }) },
);
export const changeWeddingWaiting = (joined: boolean) => weddingFetch<WeddingParticipationState>(
  "/wedding/waiting-room", { method: "PUT", body: JSON.stringify({ joined }) },
);
export const heartbeatWeddingWaiting = () => weddingFetch<WeddingParticipationState>(
  "/wedding/waiting-room/heartbeat", { method: "POST" },
);

export function assertWeddingGalleryFile(file: File): string | null {
  return validateWeddingGalleryFile(file);
}

export { WEDDING_GALLERY_MAX_BYTES };
