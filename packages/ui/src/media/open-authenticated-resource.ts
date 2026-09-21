import { fetchAuthenticatedMedia, isPrivateDocument } from "../auth/media-request.js";
import { userFacingError } from "../auth/user-facing-error.js";

export async function openAuthenticatedResource(
  href: string,
  _getAccessToken?: (() => Promise<string | null>) | undefined,
): Promise<void> {
  // Retained for compatibility; the configured host session supplies current credentials.
  void _getAccessToken;
  if (!isPrivateDocument(href)) {
    if (!/^(blob:|https?:|\/)/.test(href)) throw new Error("We couldn't open this file.");
    window.open(href, "_blank", "noopener,noreferrer");
    return;
  }
  const response = await fetchAuthenticatedMedia(href);
  if (!response.ok) {
    throw new Error(userFacingError({ status: response.status }, "We couldn't open this file. Please try again."));
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
