import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";

export function assertRequestPermission(
  context: AuthContext,
  permission: string,
): void {
  if (!context.permissionKeys.has(permission)) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }
}

export function assertRequesterOrPermission(
  context: AuthContext,
  requesterId: string,
  permission: string,
): void {
  if (
    context.userId === requesterId ||
    context.permissionKeys.has(permission)
  ) {
    return;
  }

  throw new AppError({
    statusCode: 403,
    code: "FORBIDDEN",
    message: "You do not have access to this procurement request.",
  });
}
