import pino from "pino";
import { apiServiceName } from "@hamd/contracts";

import type { Environment } from "./env.js";

export function createLogger(environment: Environment): pino.Logger {
  return pino({
    level: environment.LOG_LEVEL,
    base: {
      service: apiServiceName,
      environment: environment.NODE_ENV,
    },
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.body.password",
        "req.body.currentPassword",
        "req.body.newPassword",
        "req.body.confirmPassword",
        "req.body.token",
        "req.body.refreshToken",
        "req.body.otp",
        "req.body.code",
        "res.headers.set-cookie",
      ],
      censor: "[REDACTED]",
    },
  });
}
