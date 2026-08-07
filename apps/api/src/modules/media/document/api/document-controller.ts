import type { Request, RequestHandler, Response } from "express";

import { AppError } from "../../../../lib/app-error.js";
import { parseMultipartFiles } from "../../../../shared/uploads/multipart.js";
import type { DocumentService } from "../application/document-service.js";

export class DocumentController {
  public constructor(private readonly service: DocumentService) {}

  public readonly upload: RequestHandler = async (request, response, next) => {
    try {
      const mapped = await parseMultipartFiles(request);
      const saved = await this.service.uploadMany(
        auth(request),
        mapped,
        requestId(response),
      );
      response.status(201).json({
        data: saved.map((document) => this.service.serialize(document)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly download: RequestHandler = async (request, response, next) => {
    try {
      const documentId = String(request.params.documentId ?? "");
      const document = await this.service.getAccessible(auth(request), documentId);
      response.setHeader("Content-Type", document.mimeType);
      response.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(document.originalFilename)}"`,
      );
      response.setHeader("Content-Length", String(document.sizeBytes));
      response.setHeader("Cache-Control", "private, no-store");
      this.service.openReadStream(document).pipe(response);
    } catch (error) {
      next(error);
    }
  };
}

function auth(request: Request) {
  if (!request.auth) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required.",
    });
  }
  return request.auth;
}

function requestId(response: Response): string {
  return response.locals.requestId as string;
}
