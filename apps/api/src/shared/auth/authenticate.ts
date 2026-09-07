import { TextEncoder } from "node:util";

import { jwtVerify } from "jose";

import type { RequestHandler } from "express";

import type { Environment } from "../../config/env.js";
import { AppError } from "../../lib/app-error.js";
import type { DatabaseClient } from "../database/database-client.js";
import type { AuthContext } from "./auth-context.js";

export interface AccessTokenClaims {
  readonly sub: string;
  readonly org: string;
  readonly sid: string;
  readonly ver: number;
}

export function createAuthenticate(
  database: DatabaseClient,
  environment: Environment,
): RequestHandler {
  return async (request, _response, next) => {
    try {
      const token = getBearerToken(request.header("authorization"));
      const claims = await verifyAccessToken(token, environment);
      const context = await resolveAuthContext(database, claims);

      request.auth = context;
      next();
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : new AppError({
              statusCode: 401,
              code: "UNAUTHENTICATED",
              message: "Authentication is required.",
            }),
      );
    }
  };
}

/**
 * Attaches auth when a valid bearer token is present; otherwise continues anonymously.
 * Used for public reads that optionally expand for Ops (`includeUnpublished`).
 */
export function createOptionalAuthenticate(
  database: DatabaseClient,
  environment: Environment,
): RequestHandler {
  return async (request, _response, next) => {
    const header = request.header("authorization");
    if (!header) {
      next();
      return;
    }
    try {
      const token = getBearerToken(header);
      const claims = await verifyAccessToken(token, environment);
      request.auth = await resolveAuthContext(database, claims);
      next();
    } catch {
      next();
    }
  };
}

export async function verifyAccessToken(
  token: string,
  environment: Environment,
): Promise<AccessTokenClaims> {
  if (!environment.JWT_ACCESS_SECRET) {
    throw new AppError({
      statusCode: 503,
      code: "AUTH_CONFIGURATION_ERROR",
      message: "Authentication is not configured.",
      details: [
        {
          code: "AUTH_CONFIGURATION_ERROR",
          message: "JWT_ACCESS_SECRET is not configured.",
        },
      ],
    });
  }

  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(environment.JWT_ACCESS_SECRET),
    {
      issuer: environment.JWT_ISSUER,
      audience: environment.JWT_AUDIENCE,
    },
  );
  const { sub, org, sid, ver } = verified.payload;

  if (
    typeof sub !== "string" ||
    typeof org !== "string" ||
    typeof sid !== "string" ||
    typeof ver !== "number"
  ) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
      details: [
        {
          code: "INVALID_ACCESS_TOKEN",
          message: "Access token claims are invalid.",
        },
      ],
    });
  }

  return { sub, org, sid, ver };
}

async function resolveAuthContext(
  database: DatabaseClient,
  claims: AccessTokenClaims,
): Promise<AuthContext> {
  const session = await database.userSession.findFirst({
    where: {
      id: claims.sid,
      userId: claims.sub,
      status: "active",
      expiresAt: { gt: new Date() },
      user: { status: "active", tokenVersion: claims.ver },
    },
    select: { id: true },
  });

  if (!session) {
    throw new AppError({
      statusCode: 401,
      code: "SESSION_REVOKED",
      message: "Your session is no longer active.",
      details: [
        { code: "SESSION_REVOKED", message: "Session is inactive or expired." },
      ],
    });
  }

  const membership = await database.organizationMembership.findFirst({
    where: {
      organizationId: claims.org,
      userId: claims.sub,
      status: "active",
    },
    select: {
      id: true,
          roles: {
            where: {
              startsAt: { lte: new Date() },
              OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
            },
            select: {
              role: {
                select: {
                  permissions: {
                    select: { permission: { select: { key: true } } },
                  },
                },
              },
            },
          },
    },
  });

  if (!membership) {
    throw new AppError({
      statusCode: 403,
      code: "FORBIDDEN",
      message: "You do not have access to this organization.",
      details: [
        {
          code: "INACTIVE_ORGANIZATION_MEMBERSHIP",
          message: "An active organization membership is required.",
        },
      ],
    });
  }

  return {
    userId: claims.sub,
    organizationId: claims.org,
    membershipId: membership.id,
    sessionId: session.id,
    permissionKeys: new Set(
      membership.roles.flatMap((membershipRole) =>
        membershipRole.role.permissions.map(
          (rolePermission) => rolePermission.permission.key,
        ),
      ),
    ),
  };
}

function getBearerToken(header: string | undefined): string {
  const [scheme, token] = header?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
      details: [
        {
          code: "MISSING_BEARER_TOKEN",
          message: "Use an Authorization header with a Bearer token.",
        },
      ],
    });
  }

  return token;
}
