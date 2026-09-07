import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";

export function assertInvoicePermission(
  context: AuthContext,
  permission: string,
): void {
  if (!context.permissionKeys.has(permission)) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this invoice action.",
    });
  }
}
