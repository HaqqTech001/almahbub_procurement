/** Shared catalog object-key rules. Private StoredDocument paths must not reuse this. */

const PRODUCT_ID = /^[0-9a-f-]{36}$/i;
const FILENAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,240}$/;

export type StoredCatalogMediaRef = {
  productId: string;
  filename: string;
};

export function assertCatalogMediaPath(input: {
  productId: string;
  filename: string;
}): StoredCatalogMediaRef {
  if (!PRODUCT_ID.test(input.productId) || input.filename.includes("..") || !FILENAME.test(input.filename)) {
    throw new Error("Unsafe catalog media path.");
  }
  return { productId: input.productId, filename: input.filename };
}

export function catalogObjectKey(input: StoredCatalogMediaRef): string {
  const safe = assertCatalogMediaPath(input);
  return `catalog/${safe.productId}/${safe.filename}`;
}

export function parseStoredCatalogMediaUrl(url: string): StoredCatalogMediaRef | null {
  const relative = /^\/api\/v1\/public\/catalog-media\/([0-9a-f-]{36})\/([a-zA-Z0-9._-]+)$/i.exec(
    url,
  );
  if (relative) {
    return { productId: relative[1]!, filename: relative[2]! };
  }
  const supabase =
    /\/storage\/v1\/object\/public\/[^/]+\/catalog\/([0-9a-f-]{36})\/([a-zA-Z0-9._-]+)(?:\?|$)/i.exec(
      url,
    );
  if (supabase) {
    return { productId: supabase[1]!, filename: supabase[2]! };
  }
  const s3 = /\/catalog\/([0-9a-f-]{36})\/([a-zA-Z0-9._-]+)(?:\?|$)/i.exec(url);
  if (s3) {
    return { productId: s3[1]!, filename: s3[2]! };
  }
  return null;
}

export function mimeFromFilename(filename: string): string {
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  if (ext === ".mp4") return "video/mp4";
  return "application/octet-stream";
}
