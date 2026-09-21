import { createHash } from "node:crypto";
import { open } from "node:fs/promises";
import { resolve } from "node:path";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import {
  assertCatalogMediaPath,
  parseStoredCatalogMediaUrl,
} from "./catalog-media-path.js";
import { isPublicIpv4, hasImageSignature } from "./product-media-health.js";

const maxBytes = 20 * 1024 * 1024;
// Review approval is bound to the bytes, not merely a URL that could be replaced.
// No authenticated/private fetching. Public DNS addresses are pinned per request.
async function remoteHash(
  source: string,
  redirects = 0,
): Promise<string | null> {
  try {
    const url = new URL(source);
    if (
      !/^https?:$/.test(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && !["80", "443"].includes(url.port))
    )
      return null;
    const addresses = await Promise.race([
      lookup(url.hostname, { family: 4, all: true }),
      new Promise<never>((_, reject) => {
        const timer = setTimeout(() => reject(new Error("DNS timeout")), 3000);
        timer.unref();
      }),
    ]);
    if (
      !addresses.length ||
      addresses.some((item) => !isPublicIpv4(item.address))
    )
      return null;
    return await new Promise<string | null>((resolveResult) => {
      const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
        url,
        {
          method: "GET",
          family: 4,
          headers: { Accept: "image/*" },
          lookup: (_host, _options, callback) =>
            callback(null, addresses[0]!.address, 4),
        },
        (response) => {
          if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
            response.destroy();
            if (!response.headers.location || redirects >= 3) {
              resolveResult(null);
              return;
            }
            try {
              void remoteHash(
                new URL(response.headers.location, url).href,
                redirects + 1,
              ).then(resolveResult);
            } catch {
              resolveResult(null);
            }
            return;
          }
          if (
            response.statusCode !== 200 ||
            !response.headers["content-type"]?.startsWith("image/") ||
            Number(response.headers["content-length"] ?? 0) > maxBytes
          ) {
            response.destroy();
            resolveResult(null);
            return;
          }
          const hash = createHash("sha256");
          let size = 0;
          let prefix = Buffer.alloc(0);
          response.on("data", (chunk: Buffer) => {
            size += chunk.length;
            if (size > maxBytes) {
              response.destroy();
              resolveResult(null);
              return;
            }
            if (prefix.length < 64)
              prefix = Buffer.concat([
                prefix,
                chunk.subarray(0, 64 - prefix.length),
              ]);
            hash.update(chunk);
          });
          response.on("end", () =>
            resolveResult(
              size > 0 && hasImageSignature(prefix) ? hash.digest("hex") : null,
            ),
          );
          response.on("error", () => resolveResult(null));
          response.on("close", () => {
            if (!response.complete) resolveResult(null);
          });
        },
      );
      const timer = setTimeout(() => {
        resolveResult(null);
        request.destroy();
      }, 8000);
      request.on("close", () => clearTimeout(timer));
      request.on("error", () => resolveResult(null));
      request.end();
    });
  } catch {
    return null;
  }
}

export async function inspectReviewedMediaHash(
  source: string,
  uploadRoot = resolve(process.env.UPLOAD_ROOT || "uploads"),
): Promise<string | null> {
  if (!source.startsWith("/api/v1/public/catalog-media/"))
    return remoteHash(source);
  const reference = parseStoredCatalogMediaUrl(source);
  if (!reference) return null;
  try {
    const safe = assertCatalogMediaPath(reference);
    const file = await open(
      resolve(uploadRoot, "public/catalog", safe.productId, safe.filename),
      "r",
    );
    try {
      const size = (await file.stat()).size;
      if (!size || size > maxBytes) return null;
      const bytes = await file.readFile();
      return bytes.length <= maxBytes &&
        hasImageSignature(bytes.subarray(0, 64))
        ? createHash("sha256").update(bytes).digest("hex")
        : null;
    } finally {
      await file.close();
    }
  } catch {
    return null;
  }
}

const cache = new Map<
  string,
  { until: number; result: Promise<string | null> }
>();
export function reviewedMediaHash(source: string): Promise<string | null> {
  const existing = cache.get(source);
  if (existing && existing.until > Date.now()) return existing.result;
  if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
  const result = inspectReviewedMediaHash(source);
  cache.set(source, { until: Date.now() + 30000, result });
  return result;
}
