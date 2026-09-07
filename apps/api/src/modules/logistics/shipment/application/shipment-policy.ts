import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";

export function assertShipmentPermission(context: AuthContext, permission: string): void {
  if (!context.permissionKeys.has(permission)) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this shipment action.",
    });
  }
}

/** Directory/detail: buyers with request access can still load their shipments. */
export function assertShipmentRead(context: AuthContext): void {
  if (
    context.permissionKeys.has("shipment:read") ||
    context.permissionKeys.has("request:read")
  ) {
    return;
  }
  throw new AppError({
    statusCode: 403,
    code: "FORBIDDEN",
    message: "You do not have permission to perform this shipment action.",
  });
}

export function assertOperationsUser(context: AuthContext): void {
  if (!context.permissionKeys.has("shipment:confirm")) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "Only operations users may confirm delivery.",
    });
  }
}
