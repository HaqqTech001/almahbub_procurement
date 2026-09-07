import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

type Media = { src?: string; alt?: string; caption?: string; stage?: string };
type ProvenanceAsset = {
  path?: string | null;
  publicSrc?: string;
  downloadUrl?: string;
  status?: string;
  aliasesTo?: string;
};

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const uploadRoot = join(root, "apps/api/uploads");

function extensionFor(bytes: Buffer): ".jpg" | ".png" | ".webp" | ".gif" {
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[8] === 0x57 && bytes[9] === 0x45) {
    return ".webp";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return ".jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return ".png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return ".gif";
  return ".jpg";
}

function catalogUrl(commodityId: string, filename: string): string {
  return `/api/v1/public/catalog-media/${commodityId}/${filename}`;
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "AlmahbubCommodityMediaRecovery/1.0 (beta restore of licensed provenance files)",
      Accept: "image/*,*/*",
    },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function main(): Promise<void> {
  const envText = await (await import("node:fs/promises")).readFile(join(root, "database/.env"), "utf8");
  const dbUrl = envText
    .split(/\r?\n/)
    .find((line) => line.startsWith("DATABASE_URL="))
    ?.slice("DATABASE_URL=".length)
    .replace(/^"|"$/g, "");
  if (!dbUrl) throw new Error("DATABASE_URL missing");
  const provenance = JSON.parse(
    await (await import("node:fs/promises")).readFile(
      join(root, "docs/ie-commodity-media-provenance.json"),
      "utf8",
    ),
  ) as { assets: ProvenanceAsset[] };
  const byPath = new Map<string, ProvenanceAsset>();
  for (const asset of provenance.assets) {
    if (asset.path) byPath.set(asset.path, asset);
    if (asset.publicSrc) byPath.set(asset.publicSrc, asset);
    const file = (asset.path ?? asset.publicSrc ?? "").split("/").pop();
    if (file) byPath.set(file, asset);
    if (file) byPath.set(file.replace(/\.[^.]+$/, ""), asset);
  }

  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  const rows = await client.query<{
    id: string;
    slug: string;
    hero_media: Media | null;
    gallery: Media[] | null;
  }>(
    `select id::text, slug, hero_media, gallery from integrated_export_commodities where archived_at is null order by sort_order`,
  );

  let recovered = 0;
  let missing = 0;
  const seen = new Map<string, string>();

  for (const row of rows.rows) {
    const gallery = Array.isArray(row.gallery) ? row.gallery : [];
    const nextHero = row.hero_media ? { ...row.hero_media } : null;
    const nextGallery = gallery.map((item) => ({ ...item }));

    const restore = async (media: Media | null): Promise<Media | null> => {
      if (!media?.src) return media;
      if (media.src.startsWith("/api/v1/public/catalog-media/")) {
        const parts = media.src.split("/");
        const filename = parts[parts.length - 1] ?? "";
        const filePath = join(uploadRoot, "public", "catalog", row.id, filename);
        try {
          await access(filePath, constants.R_OK);
          recovered += 1;
          return media;
        } catch {
          /* file missing — fall through and re-download from provenance */
        }
      }
      const cached = seen.get(media.src);
      if (cached) {
        const cachedName = cached.split("/").pop() ?? "";
        const cachedPath = join(uploadRoot, "public", "catalog", row.id, cachedName);
        try {
          await access(cachedPath, constants.R_OK);
          recovered += 1;
          return { ...media, src: cached };
        } catch {
          /* continue to download */
        }
      }
      const filename = media.src.split("/").pop() ?? "";
      const stem = filename.replace(/\.[^.]+$/, "");
      const asset = byPath.get(media.src) ?? byPath.get(filename) ?? byPath.get(stem);
      const aliased = asset?.aliasesTo ? byPath.get(asset.aliasesTo) : undefined;
      const downloadUrl = asset?.downloadUrl ?? aliased?.downloadUrl;
      if (!downloadUrl) {
        missing += 1;
        console.log(JSON.stringify({ slug: row.slug, src: media.src, result: "no-download-url" }));
        return media;
      }
      try {
        const bytes = await download(downloadUrl);
        const ext = extensionFor(bytes);
        const base = (media.src.split("/").pop() ?? "image.webp").replace(/\.[^.]+$/, "");
        const filename = `${base}${ext}`;
        const dir = join(uploadRoot, "public", "catalog", row.id);
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, filename), bytes);
        const url = catalogUrl(row.id, filename);
        seen.set(media.src, url);
        recovered += 1;
        console.log(
          JSON.stringify({
            slug: row.slug,
            from: media.src,
            to: url,
            bytes: bytes.length,
            type: ext,
          }),
        );
        return { ...media, src: url };
      } catch (error) {
        missing += 1;
        console.log(
          JSON.stringify({
            slug: row.slug,
            src: media.src,
            result: "download-failed",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
        return media;
      }
    };

    if (nextHero) {
      Object.assign(nextHero, await restore(nextHero));
    }
    for (let index = 0; index < nextGallery.length; index += 1) {
      nextGallery[index] = (await restore(nextGallery[index] ?? null)) ?? nextGallery[index]!;
    }

    await client.query(
      `update integrated_export_commodities set hero_media = $2::jsonb, gallery = $3::jsonb, updated_at = now() where id = $1::uuid`,
      [row.id, nextHero ? JSON.stringify(nextHero) : null, JSON.stringify(nextGallery)],
    );
  }

  console.log(JSON.stringify({ recovered, missing, uploadRoot }));
  await client.end();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
