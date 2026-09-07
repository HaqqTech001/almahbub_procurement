import type { RequestHandler } from "express";

import {
  requireAnyPermission,
  requirePermission,
} from "../../../../shared/auth/require-permission.js";

/**
 * HTTP floor for quotation transitions.
 *
 * Ops review/issue stay permission-gated.
 * Buyer accept/decline only needs quotation/request read; ownership is
 * enforced in the service and must not require quotation:review.
 */
export function requireQuotationTransitionPermission(): RequestHandler {
  return (request, response, next) => {
    const command =
      typeof request.body?.command === "string" ? request.body.command : "";

    if (command === "review") {
      requirePermission("quotation:review")(request, response, next);
      return;
    }
    if (command === "issue") {
      requirePermission("quotation:issue")(request, response, next);
      return;
    }
    if (command === "accept" || command === "decline") {
      requireAnyPermission(["quotation:read", "request:read"])(
        request,
        response,
        next,
      );
      return;
    }

    next();
  };
}
