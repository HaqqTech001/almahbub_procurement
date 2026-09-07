import type { ApiErrorDetail, ApiErrorEnvelope } from "@hamd/types";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../lib/app-error.js";
import { isPoolExhaustedError } from "@hamd/database";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError({
      statusCode: 404,
      code: "NOT_FOUND",
      message: `No route matches ${request.method} ${request.path}.`,
    }),
  );
};

export const errorHandler: ErrorRequestHandler = (
  error,
  request,
  response,
  next,
) => {
  void next;
  const requestId = response.locals.requestId as string;
  const normalized = normalizeError(error);

  request.log.error(
    {
      err: error,
      code: normalized.code,
      requestId,
    },
    "Request failed",
  );

  const body: ApiErrorEnvelope = {
    success: false,
    message: normalized.message,
    data: null,
    meta: {},
    errors: normalized.details ?? [],
    requestId,
    timestamp: new Date().toISOString(),
    error: {
      code: normalized.code,
      message: normalized.message,
      requestId,
      ...(normalized.details ? { details: normalized.details } : {}),
    },
  };

  response.status(normalized.statusCode).json(body);
};

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    const details: readonly ApiErrorDetail[] = error.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      ...(issue.path.length > 0 ? { field: issue.path.join(".") } : {}),
    }));

    return new AppError({
      statusCode: 422,
      code: "VALIDATION_ERROR",
      message: "One or more request values are invalid.",
      details,
    });
  }

  if (isPoolExhaustedError(error)) {
    return new AppError({
      statusCode: 503,
      code: "SERVICE_UNAVAILABLE",
      message: "The service is busy. Please try again.",
    });
  }

  return new AppError({
    statusCode: 500,
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred.",
    isOperational: false,
  });
}
