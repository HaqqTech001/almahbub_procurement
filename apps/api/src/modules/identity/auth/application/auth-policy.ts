import { AppError } from "../../../../lib/app-error.js";

export function requireActiveUser(status: string): void {
  if (status === "pending_verification") {
    throw new AppError({
      statusCode: 403,
      code: "EMAIL_NOT_VERIFIED",
      message: "Verify your email before signing in.",
    });
  }
  if (status !== "active") {
    throw new AppError({
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
  }
}

export function selectMembership<
  T extends { readonly organizationId: string },
>(memberships: readonly T[], organizationId?: string): T {
  const membership = organizationId
    ? memberships.find((candidate) => candidate.organizationId === organizationId)
    : memberships[0];

  if (!membership) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "An active organization membership is required.",
      details: [
        {
          code: "INACTIVE_ORGANIZATION_MEMBERSHIP",
          message: "No active organization membership is available.",
        },
      ],
    });
  }

  return membership;
}
