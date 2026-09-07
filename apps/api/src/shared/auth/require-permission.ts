import type { RequestHandler } from "express";

import { AppError } from "../../lib/app-error.js";

export function requirePermission(permission: string): RequestHandler {
  return requireAnyPermission([permission]);
}

/** Allow if the caller holds any listed permission. */
export function requireAnyPermission(
  permissions: readonly string[],
): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(
        new AppError({
          statusCode: 401,
          code: "UNAUTHENTICATED",
          message: "Authentication is required.",
          details: [
            {
              code: "AUTH_CONTEXT_MISSING",
              message: "Authentication middleware must run first.",
            },
          ],
        }),
      );
      return;
    }

    const allowed = permissions.some((permission) =>
      request.auth!.permissionKeys.has(permission),
    );
    if (!allowed) {
      next(
        new AppError({
          statusCode: 403,
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action.",
          details: [
            {
              code: "MISSING_PERMISSION",
              message: `Required permission: ${permissions.join(" | ")}.`,
            },
          ],
        }),
      );
      return;
    }

    next();
  };
}
