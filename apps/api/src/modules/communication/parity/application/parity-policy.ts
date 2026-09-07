import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";

/** Announcement / CMS / ops-side parity mutations. Buyer defaults must not qualify. */
export const PARITY_MANAGE_PERMISSIONS = [
  "ops:access",
  "cms:manage",
  "communication:publish",
] as const;

export function assertParityManage(context: AuthContext): void {
  const allowed = PARITY_MANAGE_PERMISSIONS.some((key) =>
    context.permissionKeys.has(key),
  );
  if (!allowed) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have permission to manage communication content.",
    });
  }
}

export function assertAuthenticated(context: AuthContext | undefined): AuthContext {
  if (!context) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required.",
    });
  }
  return context;
}
