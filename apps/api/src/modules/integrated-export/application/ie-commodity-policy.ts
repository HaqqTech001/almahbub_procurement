import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";

export const IE_COMMODITY_OPS_PERMISSION = "ops:access";

export function assertIeCommodityOpsAccess(context: AuthContext): void {
  if (!context.permissionKeys.has(IE_COMMODITY_OPS_PERMISSION)) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to manage Integrated Export commodities.",
      details: [
        {
          code: "MISSING_PERMISSION",
          message: `Required permission: ${IE_COMMODITY_OPS_PERMISSION}.`,
        },
      ],
    });
  }
  if (!context.organizationId) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "An active organization context is required.",
    });
  }
}

export function canViewUnpublishedIeCommodities(
  context: AuthContext | undefined,
): boolean {
  return Boolean(context?.permissionKeys.has(IE_COMMODITY_OPS_PERMISSION));
}
