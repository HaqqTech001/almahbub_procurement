import { open } from "node:fs/promises";
import { resolve } from "node:path";
import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { assertCatalogMediaPath, parseStoredCatalogMediaUrl } from "./catalog-media-path.js";

export type MediaHealth = "valid" | "missing" | "broken" | "unverified";
export function isPublicIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return !(a === 0 || a === 10 || a === 127 || a! >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b! >= 16 && b! <= 31) ||
    (a === 192 && (b === 168 || b === 0)) || (a === 100 && b! >= 64 && b! <= 127) ||
    (a === 198 && (b === 18 || b === 19)));
}
export function hasImageSignature(bytes: Buffer): boolean {
  return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    /^GIF8[79]a/.test(bytes.toString("ascii", 0, 6)) ||
    (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") ||
    (bytes.toString("ascii", 4, 8) === "ftyp" && /avif|avis/.test(bytes.toString("ascii", 8, 32)));
}

// Public GET only: DNS is validated then pinned to prevent rebinding. No cookies,
// provider keys or authorization headers. Redirects get the same validation.
async function remoteHealth(source: string, redirects = 0): Promise<MediaHealth> {
  let url: URL;
  try { url = new URL(source); } catch { return "broken"; }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password ||
      (url.port && !["80", "443"].includes(url.port))) return "broken";
  try {
    const addresses = await Promise.race([
      lookup(url.hostname, { family: 4, all: true }),
      new Promise<never>((_, reject) => { const timer = setTimeout(() => reject(new Error("DNS timeout")), 3000); timer.unref(); }),
    ]);
    if (!addresses.length || addresses.some(row => !isPublicIpv4(row.address))) return "unverified";
    return await new Promise<MediaHealth>(resolveResult => {
      const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
        method: "GET", family: 4, autoSelectFamily: false,
        headers: { Range: "bytes=0-63", Accept: "image/*" },
        lookup: (_hostname, _options, callback) => callback(null, addresses[0]!.address, 4),
      }, response => {
        const status = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          response.destroy();
          if (!response.headers.location || redirects >= 3) { resolveResult("unverified"); return; }
          try { void remoteHealth(new URL(response.headers.location, url).href, redirects + 1).then(resolveResult); }
          catch { resolveResult("broken"); }
          return;
        }
        if (status !== 200 && status !== 206) {
          response.destroy(); resolveResult(status === 404 || status === 410 ? "broken" : "unverified"); return;
        }
        if (!response.headers["content-type"]?.toLowerCase().startsWith("image/")) {
          response.destroy(); resolveResult("broken"); return;
        }
        let bytes = Buffer.alloc(0);
        response.on("data", (chunk: Buffer) => {
          bytes = Buffer.concat([bytes, chunk.subarray(0, 64 - bytes.length)]);
          if (bytes.length >= 64) { resolveResult(hasImageSignature(bytes) ? "valid" : "broken"); response.destroy(); }
        });
        response.on("end", () => resolveResult(hasImageSignature(bytes) ? "valid" : "broken"));
        response.on("error", () => resolveResult("unverified"));
        response.on("close", () => resolveResult("unverified"));
      });
      const timer = setTimeout(() => { resolveResult("unverified"); request.destroy(); }, 5000);
      request.on("close", () => clearTimeout(timer));
      request.on("error", () => resolveResult("unverified"));
      request.end();
    });
  } catch { return "unverified"; }
}

export async function inspectProductMedia(source: string | undefined, uploadRoot = resolve(process.env.UPLOAD_ROOT || "uploads")): Promise<MediaHealth> {
  if (!source?.trim()) return "missing";
  if (source.startsWith("/api/v1/public/catalog-media/")) {
    const ref = parseStoredCatalogMediaUrl(source);
    if (!ref) return "broken";
    try {
      const safe = assertCatalogMediaPath(ref);
      const file = await open(resolve(uploadRoot, "public/catalog", safe.productId, safe.filename), "r");
      try {
        const bytes = Buffer.alloc(64);
        const { bytesRead } = await file.read(bytes, 0, 64, 0);
        return hasImageSignature(bytes.subarray(0, bytesRead)) ? "valid" : "broken";
      } finally { await file.close(); }
    } catch { return "broken"; }
  }
  return remoteHealth(source);
}

const cache = new Map<string, { expires: number; result: Promise<MediaHealth> }>();
export function publicProductMediaHealth(source: string | undefined): Promise<MediaHealth> {
  if (!source) return Promise.resolve("missing");
  const cached = cache.get(source);
  if (cached && cached.expires > Date.now()) return cached.result;
  if (cache.size >= 2000) cache.delete(cache.keys().next().value!);
  const entry = { expires: Date.now() + 60000, result: inspectProductMedia(source) };
  cache.set(source, entry);
  return entry.result;
}

export async function withConcurrency<T, R>(rows: T[], work: (row: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(rows.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(8, rows.length) }, async () => {
    while (next < rows.length) { const index = next++; results[index] = await work(rows[index]!); }
  }));
  return results;
}
