import { stat } from "node:fs/promises";
import { join, normalize, resolve } from "node:path";
import { WEDDING_MEDIA_STORAGE_ID } from "@hamd/constants";

import { Router } from "express";

import { AppError } from "../../../lib/app-error.js";
import { mimeFromFilename } from "../infrastructure/catalog-media-path.js";

export type CatalogMediaAccessGate = {
  /**
   * Return true when the path id belongs to a real catalogue entity
   * (product, category, or integrated-export commodity), any status.
   * Unknown ids stay 404. Public pages still only link published records.
   */
  canServeCatalogEntity: (entityId: string) => Promise<boolean>;
};

/**
 * Public catalogue photos/videos uploaded by ops. Readable without auth so the
 * public website can render ProductImage.url / ProductVideo.url values.
 * Private StoredDocument downloads remain on /api/v1/documents/:id.
 *
 * Entity ids in the path are unguessable UUIDs. Draft ops media must render
 * after refresh, including category/commodity uploads that share this route.
 */
export function createCatalogMediaRouter(
  uploadRoot: string,
  access?: CatalogMediaAccessGate,
): Router {
  const router = Router();

  router.get("/:productId/:filename", async (request, response, next) => {
    try {
      const productId = String(request.params.productId ?? "");
      const filename = String(request.params.filename ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(productId)) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Catalog media not found.",
        });
      }
      if (
        !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,240}$/.test(filename) ||
        filename.includes("..")
      ) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Catalog media not found.",
        });
      }

      if (access && productId !== WEDDING_MEDIA_STORAGE_ID) {
        const allowed = await access.canServeCatalogEntity(productId);
        if (!allowed) {
          throw new AppError({
            statusCode: 404,
            code: "NOT_FOUND",
            message: "Catalog media not found.",
          });
        }
      }

      const catalogRoot = resolve(uploadRoot, "public", "catalog", productId);
      const absolute = resolve(join(catalogRoot, filename));
      if (!normalize(absolute).startsWith(normalize(catalogRoot))) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Catalog media not found.",
        });
      }

      let info: Awaited<ReturnType<typeof stat>>;
      try {
        info = await stat(absolute);
      } catch {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Catalog media not found.",
        });
      }
      if (!info.isFile()) {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Catalog media not found.",
        });
      }

      const mime = mimeFromFilename(filename);
      if (mime === "application/octet-stream") {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Catalog media not found.",
        });
      }

      response.setHeader("Content-Type", mime);
      response.setHeader("Cache-Control", "public, max-age=86400, immutable");
      response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      // Express handles bounded/open-ended/suffix ranges, HEAD and If-Range.
      response.sendFile(absolute, { acceptRanges: request.method === "GET" }, (error) => {
        if (!error) return;
        if (response.headersSent) {
          response.destroy();
          return;
        }
        response.removeHeader("Content-Type");
        response.removeHeader("Content-Length");
        response.setHeader("Cache-Control", "no-store");
        if ("status" in error && error.status === 416) {
          response.setHeader("Content-Range", `bytes */${info.size}`);
          response.status(416).end();
          return;
        }
        if ("status" in error && error.status === 412) {
          response.status(412).end();
          return;
        }
        next(error);
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
