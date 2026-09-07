import type { RequestHandler } from "express";

import {
  requireAnyPermission,
  requirePermission,
} from "../../../shared/auth/require-permission.js";

/**
 * HTTP floor for procurement request transitions.
 *
 * Buyer submit / revision / cancel stay requester-permissioned.
 * Administrative commands require request:manage. Ownership is still
 * enforced in the service.
 */
export function requireProcurementTransitionPermission(): RequestHandler {
  return (request, response, next) => {
    const command =
      typeof request.body?.command === "string" ? request.body.command : "";

    if (command === "submit" || command === "request_revision") {
      requireAnyPermission(["request:submit", "request:manage"])(
        request,
        response,
        next,
      );
      return;
    }
    if (command === "cancel") {
      requireAnyPermission(["request:cancel", "request:manage"])(
        request,
        response,
        next,
      );
      return;
    }

    requirePermission("request:manage")(request, response, next);
  };
}
