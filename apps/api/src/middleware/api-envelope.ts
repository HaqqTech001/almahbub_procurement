import type { RequestHandler } from "express";

/**
 * Normalizes all versioned API success payloads without changing domain
 * controllers. Errors are normalized separately by the global error handler.
 */
export const apiEnvelope: RequestHandler = (request, response, next) => {
  if (!request.path.startsWith("/api/v1")) return next();
  const originalJson = response.json.bind(response);
  response.json = ((body: unknown) => {
    if (isEnvelope(body)) return originalJson(body);
    const payload = isRecord(body) ? body : { data: body };
    return originalJson({
      success: true,
      message: "Request completed successfully.",
      data: "data" in payload ? payload.data : null,
      meta: "page" in payload ? payload.page : {},
      errors: [],
      requestId: response.locals.requestId as string,
      timestamp: new Date().toISOString(),
    });
  }) as typeof response.json;
  next();
};

function isEnvelope(value: unknown): value is { readonly success: boolean } {
  return isRecord(value) && typeof value.success === "boolean";
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
