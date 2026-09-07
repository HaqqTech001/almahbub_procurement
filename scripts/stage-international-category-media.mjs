/**
 * International category media — download licensed Unsplash / Wikimedia stills
 * and convert retained local JPGs. Does not touch IE commodity or portal media.
 *
 * Usage: node scripts/stage-international-category-media.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const USER_AGENT =
  "AlmahbubMediaStaging/1.0 (International category media; licensed Unsplash and Wikimedia Commons use)";

const SLUGS = [
  "iphones-gadgets",
  "medical-equipments",
  "home-garden-wares",
  "machineries",
  "general-procurement",
];

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    console.error("Installing sharp locally for conversion…");
    const { execSync } = await import("node:child_process");
    execSync("npm install sharp@0.33.5 --no-save --prefix scripts", {
      cwd: root,
      stdio: "inherit",
    });
    return require("./node_modules/sharp");
  }
}

function unsplashUrl(photoId) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1920&q=85`;
}

function publicPath(relFile) {
  return `/${relFile.replace(/^apps\/web\/public\//, "").replaceAll("\\", "/")}`;
}

function filenameFor(row) {
  return `intl-${row.categorySlug}-${row.imageRole}-${row.nn}.webp`;
}

function folderFor(row) {
  return `apps/web/public/media/international/categories/${row.categorySlug}/${row.imageRole}`;
}

function wipeCategoryTrees() {
  for (const slug of SLUGS) {
    const dir = path.join(
      root,
      "apps/web/public/media/international/categories",
      slug,
    );
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "image/*,application/json",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function resolveWikimedia(title) {
  const fileTitle = title.startsWith("File:") ? title : `File:${title}`;
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("titles", fileTitle);
  api.searchParams.set("prop", "imageinfo");
  api.searchParams.set("iiprop", "url|extmetadata|size");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");
  const res = await fetch(api, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Wikimedia API HTTP ${res.status}`);
  }
  const json = await res.json();
  const page = Object.values(json.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) {
    throw new Error(`Wikimedia file not found: ${fileTitle}`);
  }
  const meta = info.extmetadata ?? {};
  const artist = String(meta.Artist?.value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const license = String(meta.LicenseShortName?.value ?? meta.License?.value ?? "")
    .replace(/<[^>]+>/g, "")
    .trim();
  const licenseUrl = String(meta.LicenseUrl?.value ?? "").trim();
  return {
    downloadUrl: info.url,
    pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle.replace(/ /g, "_"))}`,
    photographer: artist || "Wikimedia Commons contributor",
    license: license || "See Wikimedia Commons file page",
    licenseUrl: licenseUrl || "https://commons.wikimedia.org/wiki/Commons:Licensing",
  };
}

function tsString(value) {
  return JSON.stringify(value);
}

function generateRegistry(sources, provenance) {
  const bySlug = Object.fromEntries(SLUGS.map((slug) => [slug, []]));
  for (const row of sources.assets) {
    const filename = filenameFor(row);
    const entry = provenance.find((item) => item.filename === filename);
    if (!entry || entry.status !== "acquired") continue;
    bySlug[row.categorySlug].push({ row, entry });
  }

  const blocks = SLUGS.map((slug) => {
    const items = bySlug[slug]
      .map(({ row, entry }) => {
        const authenticity = row.authenticity;
        return `    {
      id: ${tsString(`intl-${slug}-${row.imageRole}-${row.nn}`)},
      categorySlug: ${tsString(slug)},
      role: ${tsString(row.imageRole)},
      src: ${tsString(entry.publicSrc)},
      alt: ${tsString(row.alt)},
      kind: "representative" as const,
      authenticity: ${tsString(authenticity)},
      subject: ${tsString(row.subject)},
      source: ${tsString(
        entry.source === "wikimedia"
          ? `Wikimedia Commons — ${entry.photographer ?? "contributor"}`
          : `Unsplash — ${entry.photographer ?? "contributor"}, photo-${row.photoId ?? ""}`.replace(
              /photo-$/,
              "",
            ),
      )},
      creator: ${tsString(entry.photographer ?? "Unknown")},
      license: ${tsString(entry.license ?? sources.licenseDefault)},
      licenseUrl: ${tsString(entry.licenseUrl ?? sources.licenseUrlDefault)},
      downloadDate: ${tsString(sources.downloadDate)},
      usedOn: ["/", "/products"] as const,
    }`;
      })
      .join(",\n");
    return `  ${tsString(slug)}: [\n${items}\n  ]`;
  }).join(",\n");

  return `/**
 * Authoritative Almahbub International category media.
 * Generated by scripts/stage-international-category-media.mjs — do not mix with IE media.
 */
import type { MediaAsset } from "./media-assets.js";

export const INTERNATIONAL_CATEGORY_SLUGS = [
  "iphones-gadgets",
  "medical-equipments",
  "home-garden-wares",
  "machineries",
  "general-procurement",
] as const;

export type InternationalCategorySlug =
  (typeof INTERNATIONAL_CATEGORY_SLUGS)[number];

export type InternationalCategoryMediaAsset = MediaAsset & {
  categorySlug: InternationalCategorySlug;
  role: "hero" | "gallery" | "context";
  creator?: string;
};

export const INTERNATIONAL_CATEGORY_MEDIA_REGISTRY = {
${blocks}
} as const satisfies Record<
  InternationalCategorySlug,
  readonly InternationalCategoryMediaAsset[]
>;

export function listInternationalCategoryMedia(
  slug: string,
  role?: InternationalCategoryMediaAsset["role"],
): readonly InternationalCategoryMediaAsset[] {
  const all =
    INTERNATIONAL_CATEGORY_MEDIA_REGISTRY[
      slug as InternationalCategorySlug
    ] ?? [];
  if (!role) return all;
  return all.filter((asset) => asset.role === role);
}

export function getInternationalCategoryHero(
  slug: string,
): InternationalCategoryMediaAsset | undefined {
  return listInternationalCategoryMedia(slug, "hero")[0];
}
`;
}

async function main() {
  const sharp = await loadSharp();
  const sources = JSON.parse(
    fs.readFileSync(path.join(__dirname, "intl-category-media-sources.json"), "utf8"),
  );

  wipeCategoryTrees();

  const photoCanonical = new Map();
  const hashCanonical = new Map();
  const provenance = [];
  const acquired = [];
  const skipped = [];
  const rejected = [];
  const notFound = [];

  for (const row of sources.assets) {
    const filename = filenameFor(row);
    const folder = folderFor(row);
    const absFolder = path.join(root, folder);
    const absFile = path.join(absFolder, filename);
    const relFile = path.join(folder, filename).replaceAll("\\", "/");
    const canonicalKey =
      row.source === "local"
        ? `local:${row.localSrc}`
        : row.source === "unsplash"
          ? `unsplash:${row.photoId}`
          : `wiki:${row.wikimediaTitle}`;

    if (row.reusePhotoId || row.reuseWikimediaTitle || row.reuseLocal) {
      const canonical = photoCanonical.get(canonicalKey);
      if (canonical) {
        skipped.push({ filename, reason: "duplicate_source", aliasesTo: canonical });
        provenance.push({
          filename,
          folder,
          categorySlug: row.categorySlug,
          imageRole: row.imageRole,
          source: row.source,
          alt: row.alt,
          authenticity: row.authenticity,
          subject: row.subject,
          downloadDate: sources.downloadDate,
          status: "aliased",
          path: null,
          aliasesTo: canonical,
          photographer: row.photographer ?? null,
          license: row.license ?? sources.licenseDefault,
          licenseUrl: row.licenseUrl ?? sources.licenseUrlDefault,
          sourceUrl: row.pageUrl ?? null,
          photoId: row.photoId ?? null,
        });
        process.stdout.write("a");
        continue;
      }
    }

    if (photoCanonical.has(canonicalKey)) {
      const canonical = photoCanonical.get(canonicalKey);
      skipped.push({ filename, reason: "duplicate_source", aliasesTo: canonical });
      provenance.push({
        filename,
        folder,
        categorySlug: row.categorySlug,
        imageRole: row.imageRole,
        source: row.source,
        alt: row.alt,
        authenticity: row.authenticity,
        subject: row.subject,
        downloadDate: sources.downloadDate,
        status: "aliased",
        path: null,
        aliasesTo: canonical,
        photographer: row.photographer ?? null,
        license: row.license ?? sources.licenseDefault,
        licenseUrl: row.licenseUrl ?? sources.licenseUrlDefault,
        sourceUrl: row.pageUrl ?? null,
        photoId: row.photoId ?? null,
      });
      process.stdout.write("a");
      continue;
    }

    let buffer;
    let pageUrl = row.pageUrl ?? null;
    let photographer = row.photographer ?? null;
    let license = row.license ?? sources.licenseDefault;
    let licenseUrl = row.licenseUrl ?? sources.licenseUrlDefault;
    let downloadUrl = null;

    try {
      if (row.source === "local") {
        const absLocal = path.join(root, row.localSrc);
        if (!fs.existsSync(absLocal)) {
          throw new Error(`local source missing: ${row.localSrc}`);
        }
        buffer = fs.readFileSync(absLocal);
        downloadUrl = row.localSrc;
      } else if (row.source === "unsplash") {
        downloadUrl = unsplashUrl(row.photoId);
        buffer = await fetchBuffer(downloadUrl);
      } else if (row.source === "wikimedia") {
        const wiki = await resolveWikimedia(row.wikimediaTitle);
        downloadUrl = wiki.downloadUrl;
        pageUrl = wiki.pageUrl;
        photographer = wiki.photographer;
        license = wiki.license;
        licenseUrl = wiki.licenseUrl;
        buffer = await fetchBuffer(downloadUrl);
      } else {
        throw new Error(`Unknown source ${row.source}`);
      }
      if (buffer.length < 5_000) {
        throw new Error("response_too_small_possibly_error");
      }
    } catch (error) {
      notFound.push({ filename, reason: String(error), url: downloadUrl });
      provenance.push({
        filename,
        folder,
        categorySlug: row.categorySlug,
        imageRole: row.imageRole,
        source: row.source,
        status: "not_found",
        path: null,
        error: String(error),
      });
      process.stdout.write("x");
      continue;
    }

    const sha = crypto.createHash("sha256").update(buffer).digest("hex");
    if (hashCanonical.has(sha)) {
      const canonical = hashCanonical.get(sha);
      skipped.push({ filename, reason: "duplicate_bytes", aliasesTo: canonical });
      photoCanonical.set(canonicalKey, canonical);
      provenance.push({
        filename,
        folder,
        categorySlug: row.categorySlug,
        imageRole: row.imageRole,
        source: row.source,
        alt: row.alt,
        authenticity: row.authenticity,
        subject: row.subject,
        downloadDate: sources.downloadDate,
        status: "aliased",
        path: null,
        aliasesTo: canonical,
        sha256: sha,
        photographer,
        license,
        licenseUrl,
        sourceUrl: pageUrl,
      });
      process.stdout.write("a");
      continue;
    }

    fs.mkdirSync(absFolder, { recursive: true });
    try {
      const webp = await sharp(buffer)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      fs.writeFileSync(absFile, webp);
      const publicSrc = publicPath(relFile);
      photoCanonical.set(canonicalKey, publicSrc);
      hashCanonical.set(sha, publicSrc);
      acquired.push({ filename, path: relFile });
      provenance.push({
        filename,
        folder,
        categorySlug: row.categorySlug,
        imageRole: row.imageRole,
        source: row.source,
        alt: row.alt,
        authenticity: row.authenticity,
        subject: row.subject,
        downloadDate: sources.downloadDate,
        status: "acquired",
        path: publicSrc,
        publicSrc,
        sourceUrl: pageUrl,
        downloadUrl,
        photographer,
        license,
        licenseUrl,
        photoId: row.photoId ?? null,
        wikimediaTitle: row.wikimediaTitle ?? null,
        sha256: crypto.createHash("sha256").update(webp).digest("hex"),
      });
      process.stdout.write(".");
    } catch (error) {
      rejected.push({ filename, reason: String(error) });
      process.stdout.write("!");
    }
  }

  const report = {
    downloadDate: sources.downloadDate,
    acquired: acquired.length,
    aliased: skipped.length,
    notFound: notFound.length,
    rejected: rejected.length,
    acquiredFiles: acquired,
    skipped,
    notFound,
    rejected,
  };

  fs.writeFileSync(
    path.join(root, "docs/international-category-media-staging-report.json"),
    JSON.stringify(report, null, 2),
  );
  fs.writeFileSync(
    path.join(root, "docs/international-category-media-provenance.json"),
    JSON.stringify(
      {
        downloadDate: sources.downloadDate,
        note: "Representative/contextual licensed stock — not Almahbub facilities, staff, or inventory.",
        assets: provenance,
      },
      null,
      2,
    ),
  );

  const registryPath = path.join(
    root,
    "apps/web/src/content/international-category-media.ts",
  );
  fs.writeFileSync(registryPath, generateRegistry(sources, provenance));

  console.log(`\n${JSON.stringify(report, null, 2)}`);
  if (notFound.length || rejected.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
