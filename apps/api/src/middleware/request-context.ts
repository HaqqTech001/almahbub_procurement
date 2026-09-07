import { randomUUID } from "node:crypto";
import { requestIdSchema } from "@hamd/contracts";

import type { RequestHandler } from "express";

export const requestContext: RequestHandler = (request, response, next) => {
  const incomingRequestId = request.header("x-request-id");
  const requestId =
    incomingRequestId && requestIdSchema.safeParse(incomingRequestId).success
      ? incomingRequestId
      : randomUUID();

  response.locals.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
};
