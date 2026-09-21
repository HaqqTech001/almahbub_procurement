/** Never trust server prose as display copy. Keep diagnostics on the error object. */
export function userFacingError(error: unknown, fallback = "We couldn't complete this action. Please try again.", maxBytes?: number): string {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const nested = value.error && typeof value.error === "object" ? value.error as Record<string, unknown> : {};
  const details = Array.isArray(value.errors) ? value.errors as Array<{ code?: string }> : [];
  const codes = [value.code, nested.code, ...details.map(detail => detail.code)].join(" ").toUpperCase();
  const status = Number(value.status ?? value.statusCode);
  if (status === 401 || /UNAUTHENTICATED|MISSING_BEARER_TOKEN|SESSION_REVOKED|INVALID_REFRESH_TOKEN/.test(codes)) return "Your session has expired. Please sign in again to continue.";
  if (status === 403 || /FORBIDDEN/.test(codes)) return "You don't have permission to do that.";
  if (status === 413 || /FILE_TOO_LARGE|UPLOAD_SIZE|LIMIT_FILE_SIZE/.test(codes)) return maxBytes ? `This file is too large. Maximum file size is ${maxBytes / 1024 / 1024} MB.` : "This file is too large. Please choose a smaller file.";
  if (status === 415 || /UNSUPPORTED_MEDIA_TYPE|UPLOAD_MIME|INVALID_FILE_TYPE/.test(codes)) return "This file type isn't supported.";
  if (/EMPTY_FILE|CORRUPT_FILE|UPLOAD_FILENAME/.test(codes)) return "We couldn't read this file. Please choose another file.";
  if (/UPLOAD_COUNT/.test(codes)) return "Choose no more than 5 files at a time.";
  if (error instanceof TypeError || /NETWORK|TIMEOUT/.test(codes)) return "There is a connection problem. Please try again.";
  if (status === 429) return "Please wait a moment before trying again.";
  return fallback;
}

export function safeErrorMessage(message: string, status?: number, code?: string): string {
  const technical = /mime|multipart|busboy|multer|storageKey|requestId|stack|bearer|UNAUTHENTICATED|application\/|audio\/|video\/|image\/|^\s*[[{]|\b[A-Z]+_[A-Z_]+\b/i.test(message);
  return userFacingError({ status, code }, technical ? undefined : message);
}

export const DOCUMENT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt";
const documentTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]);
export function validateDocumentFiles(files: readonly File[]): void {
  if (files.length > 5) throw Object.assign(new Error("Choose no more than 5 files at a time."), { code: "UPLOAD_COUNT" });
  for (const file of files) {
    if (!file.size) throw Object.assign(new Error("We couldn't read this file. Please choose another file."), { code: "EMPTY_FILE" });
    if (file.size > DOCUMENT_UPLOAD_MAX_BYTES) throw Object.assign(new Error(userFacingError({ code: "FILE_TOO_LARGE" }, undefined, DOCUMENT_UPLOAD_MAX_BYTES)), { code: "FILE_TOO_LARGE" });
    if (!documentTypes.has(file.type) || !/\.(jpe?g|png|gif|webp|pdf|docx?|txt)$/i.test(file.name)) throw Object.assign(new Error("This file type isn't supported."), { code: "UNSUPPORTED_MEDIA_TYPE" });
  }
}
