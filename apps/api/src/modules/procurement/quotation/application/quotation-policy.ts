import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import type { QuotationCommand } from "../domain/quotation-state.js";

export function assertQuotationPermission(
  context: AuthContext,
  permission: string,
): void {
  if (!context.permissionKeys.has(permission)) {
    throw forbidden();
  }
}

/** Directory/detail: buyers with request access can still load issued quotes. */
export function assertQuotationRead(context: AuthContext): void {
  if (
    context.permissionKeys.has("quotation:read") ||
    context.permissionKeys.has("request:read")
  ) {
    return;
  }
  throw forbidden();
}

/**
 * A request buyer may decide a quote for their own request; privileged
 * quotation approvers may decide any tenant-scoped quote.
 */
export function assertBuyerOrQuotationApprover(
  context: AuthContext,
  requesterId: string,
): void {
  if (
    context.userId === requesterId ||
    context.permissionKeys.has("quotation:approve")
  ) {
    return;
  }
  throw forbidden();
}

/**
 * Internal Ops review/issue is permission-gated.
 * Buyer accept/decline is ownership-gated and must not require quotation:review.
 */
export function assertQuotationCommandPermission(
  context: AuthContext,
  command: QuotationCommand,
  requesterId: string,
): void {
  if (command === "review") {
    assertQuotationPermission(context, "quotation:review");
    return;
  }
  if (command === "issue") {
    assertQuotationPermission(context, "quotation:issue");
    return;
  }
  assertBuyerOrQuotationApprover(context, requesterId);
}

function forbidden(): AppError {
  return new AppError({
    statusCode: 403,
    code: "FORBIDDEN",
    message: "You do not have permission to perform this quotation action.",
  });
}
