import { randomUUID } from "node:crypto";

import { AppError } from "../../../lib/app-error.js";
import { sanitizeUploadFilename } from "../../../shared/uploads/upload-policy.js";
import type { CatalogMediaStore, CatalogMediaObject } from "./catalog-media-store.js";
import {
  assertCatalogMediaPath,
  catalogObjectKey,
  mimeFromFilename,
} from "./catalog-media-path.js";

export class SupabaseCatalogMediaStore implements CatalogMediaStore {
  public constructor(
    private readonly supabaseUrl: string,
    private readonly serviceRoleKey: string,
    private readonly bucket: string,
  ) {}

  public async put(input: {
    productId: string;
    originalFilename: string;
    bytes: Buffer;
  }): Promise<CatalogMediaObject> {
    const filename = `${randomUUID()}-${sanitizeUploadFilename(input.originalFilename)}`;
    const key = catalogObjectKey({ productId: input.productId, filename });
    let response: Response;
    try {
      response = await fetch(this.objectUrl(key), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.serviceRoleKey}`,
          apikey: this.serviceRoleKey,
          "Content-Type": mimeFromFilename(filename),
          "x-upsert": "true",
        },
        body: new Uint8Array(input.bytes),
      });
    } catch (error) {
      const cause =
        error instanceof Error && "cause" in error
          ? (error as Error & { cause?: unknown }).cause
          : undefined;
      const causeMessage =
        cause instanceof Error
          ? cause.message
          : typeof cause === "object" && cause !== null && "message" in cause
            ? String((cause as { message?: unknown }).message ?? "")
            : "";
      const code =
        typeof cause === "object" && cause !== null && "code" in cause
          ? String((cause as { code?: unknown }).code ?? "")
          : "";
      let host = "configured Supabase host";
      try {
        host = new URL(this.supabaseUrl).host || host;
      } catch {
        /* env validation normally prevents this */
      }
      throw new AppError({
        statusCode: 502,
        code: "STORAGE_UNAVAILABLE",
        message: `Supabase catalog upload network failure for ${host}: ${[
          error instanceof Error ? error.message : String(error),
          code,
          causeMessage,
        ]
          .filter(Boolean)
          .join(" / ")}`,
      });
    }
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new AppError({
        statusCode: 502,
        code: "STORAGE_UNAVAILABLE",
        message: `Supabase catalog upload failed (${response.status})${body ? `: ${body.slice(0, 300)}` : "."}`,
      });
    }
    return {
      filename,
      publicUrl: `${this.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${this.bucket}/${key}`,
    };
  }

  public async remove(input: { productId: string; filename: string }): Promise<void> {
    const safe = assertCatalogMediaPath(input);
    const key = catalogObjectKey(safe);
    try {
      await fetch(this.objectUrl(key), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.serviceRoleKey}`,
          apikey: this.serviceRoleKey,
        },
      });
    } catch {
      /* object may already be absent */
    }
  }

  private objectUrl(key: string): string {
    return `${this.supabaseUrl.replace(/\/$/, "")}/storage/v1/object/${this.bucket}/${key}`;
  }
}
