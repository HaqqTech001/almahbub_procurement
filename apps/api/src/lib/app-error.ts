import type { ApiErrorDetail } from "@hamd/types";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: readonly ApiErrorDetail[];
  public readonly retryAfterSeconds?: number;
  public readonly isOperational: boolean;

  public constructor(options: {
    statusCode: number;
    code: string;
    message: string;
    details?: readonly ApiErrorDetail[];
    isOperational?: boolean;
    retryAfterSeconds?: number;
  }) {
    super(options.message);
    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    if (options.details) {
      this.details = options.details;
    }
    if (options.retryAfterSeconds !== undefined) this.retryAfterSeconds = options.retryAfterSeconds;
    this.isOperational = options.isOperational ?? true;
  }
}
