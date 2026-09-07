import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";

export function assertGuidanceRead(context: AuthContext): void {
  if (
    !context.permissionKeys.has("guidance:read") &&
    !context.permissionKeys.has("guidance:manage")
  ) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to access guidance.",
    });
  }
}

export function assertGuidanceManage(context: AuthContext): void {
  if (!context.permissionKeys.has("guidance:manage")) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to manage guidance content.",
    });
  }
}
