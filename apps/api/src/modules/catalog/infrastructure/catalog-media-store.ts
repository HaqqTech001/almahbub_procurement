import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

import { AppError } from "../../../lib/app-error.js";
import { sanitizeUploadFilename } from "../../../shared/uploads/upload-policy.js";
import { assertCatalogMediaPath } from "./catalog-media-path.js";
import { S3CatalogMediaStore } from "./s3-catalog-media-store.js";
import { SupabaseCatalogMediaStore } from "./supabase-catalog-media-store.js";

export type CatalogMediaObject = {
  filename: string;
  publicUrl: string;
};

/**
 * Public catalogue photographs only. Private StoredDocument attachments stay
 * on /api/v1/documents and must not share this store.
 */
export interface CatalogMediaStore {
  put(input: {
    productId: string;
    originalFilename: string;
    bytes: Buffer;
  }): Promise<CatalogMediaObject>;
  remove(input: { productId: string; filename: string }): Promise<void>;
}

export class LocalDiskCatalogMediaStore implements CatalogMediaStore {
  public constructor(private readonly uploadRoot: string) {}

  public async put(input: {
    productId: string;
    originalFilename: string;
    bytes: Buffer;
  }): Promise<CatalogMediaObject> {
    assertCatalogMediaPath({
      productId: input.productId,
      filename: "placeholder.png",
    });
    const safeName = sanitizeUploadFilename(input.originalFilename);
    const filename = `${randomUUID()}-${safeName}`;
    const relativeDir = join("public", "catalog", input.productId);
    await mkdir(join(this.uploadRoot, relativeDir), { recursive: true });
    await writeFile(join(this.uploadRoot, relativeDir, filename), input.bytes);
    return {
      filename,
      publicUrl: `/api/v1/public/catalog-media/${input.productId}/${filename}`,
    };
  }

  public async remove(input: {
    productId: string;
    filename: string;
  }): Promise<void> {
    const safe = assertCatalogMediaPath(input);
    try {
      await unlink(
        join(this.uploadRoot, "public", "catalog", safe.productId, safe.filename),
      );
    } catch {
      /* file may already be absent */
    }
  }
}

export type CatalogMediaDriver = "local" | "s3" | "supabase";

export type CatalogMediaStoreOptions = {
  uploadRoot: string;
  driver?: string | undefined;
  nodeEnv?: string | undefined;
  s3Bucket?: string | undefined;
  s3Region?: string | undefined;
  s3AccessKeyId?: string | undefined;
  s3SecretAccessKey?: string | undefined;
  s3PublicBaseUrl?: string | undefined;
  supabaseUrl?: string | undefined;
  supabaseServiceRoleKey?: string | undefined;
  supabaseBucket?: string | undefined;
};

function notConfigured(message: string): never {
  throw new AppError({
    statusCode: 503,
    code: "STORAGE_NOT_CONFIGURED",
    message,
  });
}

/**
 * Local disk is development-only. Object storage is selected explicitly.
 * Missing credentials fail closed — they never fall back to local disk.
 */
export function createCatalogMediaStore(
  options: CatalogMediaStoreOptions,
): CatalogMediaStore {
  const driver = (options.driver ?? "local").trim().toLowerCase();
  const production = options.nodeEnv === "production";

  if (driver === "local" || driver === "") {
    if (production) {
      notConfigured(
        "CATALOG_MEDIA_DRIVER=local is not allowed in production. Set s3 or supabase with credentials.",
      );
    }
    return new LocalDiskCatalogMediaStore(options.uploadRoot);
  }

  if (driver === "s3") {
    if (
      !options.s3Bucket ||
      !options.s3Region ||
      !options.s3AccessKeyId ||
      !options.s3SecretAccessKey
    ) {
      notConfigured(
        "CATALOG_MEDIA_DRIVER=s3 requires CATALOG_MEDIA_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY. Local disk is not a production substitute.",
      );
    }
    return new S3CatalogMediaStore(
      options.s3Bucket,
      options.s3Region,
      options.s3AccessKeyId,
      options.s3SecretAccessKey,
      options.s3PublicBaseUrl,
    );
  }

  if (driver === "supabase") {
    if (!options.supabaseUrl || !options.supabaseServiceRoleKey) {
      notConfigured(
        "CATALOG_MEDIA_DRIVER=supabase requires CATALOG_MEDIA_SUPABASE_URL and CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY. Local disk is not a production substitute.",
      );
    }
    return new SupabaseCatalogMediaStore(
      options.supabaseUrl,
      options.supabaseServiceRoleKey,
      options.supabaseBucket?.trim() || "catalog-public",
    );
  }

  notConfigured(
    `Unknown CATALOG_MEDIA_DRIVER "${driver}". Use local, s3, or supabase.`,
  );
}
