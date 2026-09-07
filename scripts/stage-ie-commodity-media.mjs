/**
 * IE-11C — download licensed Unsplash / Wikimedia images for published IE commodities.
 * Usage: node scripts/stage-ie-commodity-media.mjs
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
  "AlmahbubMediaStaging/1.0 (IE-11C commodity catalogue; licensed Unsplash and Wikimedia Commons use)";

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
  return `ie-${row.commoditySlug}-${row.imageRole}-${row.nn}.webp`;
}

function folderFor(row) {
  return `apps/web/public/media/ie/commodities/${row.commoditySlug}/${row.imageRole}`;
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

async function main() {
  const sharp = await loadSharp();
  const sources = JSON.parse(
    fs.readFileSync(path.join(__dirname, "ie-commodity-media-sources.json"), "utf8"),
  );

  const photoCanonical = new Map();
  const wikiCanonical = new Map();
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
      row.source === "unsplash" ? `unsplash:${row.photoId}` : `wiki:${row.wikimediaTitle}`;

    if (photoCanonical.has(canonicalKey) || wikiCanonical.has(canonicalKey)) {
      const canonical = photoCanonical.get(canonicalKey) || wikiCanonical.get(canonicalKey);
      skipped.push({ filename, reason: "duplicate_source", aliasesTo: canonical });
      provenance.push({
        filename,
        folder,
        commoditySlug: row.commoditySlug,
        imageRole: row.imageRole,
        source: row.source,
        alt: row.alt,
        authenticity: row.authenticity,
        downloadDate: sources.downloadDate,
        status: "aliased",
        path: null,
        aliasesTo: canonical,
        photographer: row.photographer ?? null,
        license: row.license ?? null,
        licenseUrl: row.licenseUrl ?? null,
        sourceUrl: row.pageUrl ?? null,
        photoId: row.photoId ?? null,
        wikimediaTitle: row.wikimediaTitle ?? null,
      });
      process.stdout.write("a");
      continue;
    }

    let downloadUrl;
    let pageUrl = row.pageUrl ?? null;
    let photographer = row.photographer ?? null;
    let license = row.license ?? null;
    let licenseUrl = row.licenseUrl ?? null;

    try {
      if (row.source === "unsplash") {
        downloadUrl = unsplashUrl(row.photoId);
      } else if (row.source === "wikimedia") {
        const wiki = await resolveWikimedia(row.wikimediaTitle);
        downloadUrl = wiki.downloadUrl;
        pageUrl = wiki.pageUrl;
        photographer = wiki.photographer;
        license = wiki.license;
        licenseUrl = wiki.licenseUrl;
      } else {
        throw new Error(`Unknown source ${row.source}`);
      }
    } catch (error) {
      notFound.push({ filename, reason: String(error) });
      provenance.push({
        filename,
        folder,
        commoditySlug: row.commoditySlug,
        imageRole: row.imageRole,
        source: row.source,
        status: "not_found",
        path: null,
        error: String(error),
      });
      process.stdout.write("x");
      continue;
    }

    fs.mkdirSync(absFolder, { recursive: true });

    if (fs.existsSync(absFile) && fs.statSync(absFile).size > 1000) {
      acquired.push({ filename, path: relFile, reused: true });
      photoCanonical.set(canonicalKey, publicPath(relFile));
      wikiCanonical.set(canonicalKey, publicPath(relFile));
      provenance.push({
        filename,
        folder,
        commoditySlug: row.commoditySlug,
        imageRole: row.imageRole,
        source: row.source,
        alt: row.alt,
        authenticity: row.authenticity,
        downloadDate: sources.downloadDate,
        status: "acquired",
        path: publicPath(relFile),
        publicSrc: publicPath(relFile),
        sourceUrl: pageUrl,
        downloadUrl,
        photographer,
        license,
        licenseUrl,
        photoId: row.photoId ?? null,
        wikimediaTitle: row.wikimediaTitle ?? null,
        reusedExistingFile: true,
      });
      process.stdout.write("r");
      continue;
    }

    let buffer;
    try {
      buffer = await fetchBuffer(downloadUrl);
      if (buffer.length < 5_000) {
        rejected.push({ filename, reason: "response_too_small_possibly_error" });
        process.stdout.write("!");
        continue;
      }
    } catch (error) {
      notFound.push({ filename, reason: String(error), url: downloadUrl });
      process.stdout.write("x");
      continue;
    }

    const sha = crypto.createHash("sha256").update(buffer).digest("hex");
    if (hashCanonical.has(sha)) {
      const canonical = hashCanonical.get(sha);
      skipped.push({ filename, reason: "duplicate_bytes", aliasesTo: canonical });
      photoCanonical.set(canonicalKey, canonical);
      wikiCanonical.set(canonicalKey, canonical);
      provenance.push({
        filename,
        folder,
        commoditySlug: row.commoditySlug,
        imageRole: row.imageRole,
        source: row.source,
        alt: row.alt,
        authenticity: row.authenticity,
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

    try {
      const webp = await sharp(buffer)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      fs.writeFileSync(absFile, webp);
      const outSha = crypto.createHash("sha256").update(webp).digest("hex");
      const publicSrc = publicPath(relFile);
      photoCanonical.set(canonicalKey, publicSrc);
      wikiCanonical.set(canonicalKey, publicSrc);
      hashCanonical.set(sha, publicSrc);
      hashCanonical.set(outSha, publicSrc);
      acquired.push({ filename, path: relFile, bytes: webp.length });
      provenance.push({
        filename,
        folder,
        commoditySlug: row.commoditySlug,
        imageRole: row.imageRole,
        source: row.source,
        alt: row.alt,
        authenticity: row.authenticity,
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
        sha256: outSha,
        bytes: webp.length,
      });
      process.stdout.write(".");
    } catch (error) {
      rejected.push({ filename, reason: `convert_failed: ${error}` });
      process.stdout.write("!");
    }
  }

  const report = {
    phase: "IE-11C-commodity-media",
    downloadDate: sources.downloadDate,
    acquired: acquired.length,
    skipped: skipped.length,
    rejected: rejected.length,
    notFound: notFound.length,
    details: { acquired, skipped, rejected, notFound },
  };

  fs.writeFileSync(
    path.join(root, "docs/ie-commodity-media-staging-report.json"),
    JSON.stringify(report, null, 2),
  );
  fs.writeFileSync(
    path.join(root, "docs/ie-commodity-media-provenance.json"),
    JSON.stringify(
      {
        downloadDate: sources.downloadDate,
        representativeCaption:
          "Representative imagery for illustration — not Almahbub facilities, staff, farms, or product lots.",
        assets: provenance,
      },
      null,
      2,
    ),
  );

  console.log(
    "\n",
    JSON.stringify(
      {
        acquired: acquired.length,
        skipped: skipped.length,
        rejected: rejected.length,
        notFound: notFound.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
