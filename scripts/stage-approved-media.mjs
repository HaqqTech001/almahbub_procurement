/**
 * IE-IMAGE-02 — download & stage downloadAllowed:true assets from Unsplash.
 * Usage: node scripts/stage-approved-media.mjs
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

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

function pageUrl(photoId) {
  return `https://unsplash.com/photos/${photoId}`;
}

async function main() {
  const sharp = await loadSharp();
  const sources = JSON.parse(
    fs.readFileSync(path.join(__dirname, "ie-image-02-sources.json"), "utf8"),
  );
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(root, "docs/integrated-export-image-acquisition-manifest.json"),
      "utf8",
    ),
  );

  const allowed = new Set(manifest.validationIndex.allowedFilenamesNow);
  const deferred = new Set(
    manifest.validationIndex.deferredFilenamesUntilOwnerConfirmation,
  );

  /** @type {Array<Record<string, unknown>>} */
  const rows = [...sources.iePortal, ...sources.international];

  // Deduplicate source list by filename (keep last valid)
  const byFilename = new Map();
  for (const row of rows) {
    if (row.photographer === "INVALID" || String(row.photoId).includes("8c8c8c")) {
      continue;
    }
    byFilename.set(row.filename, row);
  }

  const photoCanonical = new Map(); // photoId -> relative path
  const hashCanonical = new Map(); // sha256 -> relative path
  const provenance = [];
  const acquired = [];
  const skipped = [];
  const rejected = [];
  const notFound = [];

  for (const row of byFilename.values()) {
    if (deferred.has(row.filename)) {
      skipped.push({ filename: row.filename, reason: "deferred_commodity_pack" });
      continue;
    }
    if (!allowed.has(row.filename)) {
      skipped.push({
        filename: row.filename,
        reason: "not_in_allowedFilenamesNow",
      });
      continue;
    }

    const absFolder = path.join(root, row.folder);
    const absFile = path.join(absFolder, row.filename);
    const relFile = path
      .join(row.folder, row.filename)
      .replaceAll("\\", "/");

    if (photoCanonical.has(row.photoId)) {
      const canonical = photoCanonical.get(row.photoId);
      skipped.push({
        filename: row.filename,
        reason: "duplicate_source_photo",
        aliasesTo: canonical,
        photoId: row.photoId,
      });
      provenance.push({
        ...meta(row, sources),
        status: "aliased",
        path: null,
        aliasesTo: canonical,
      });
      continue;
    }

    fs.mkdirSync(absFolder, { recursive: true });

    if (fs.existsSync(absFile) && fs.statSync(absFile).size > 1000) {
      acquired.push({ filename: row.filename, path: relFile, bytes: fs.statSync(absFile).size, reused: true });
      photoCanonical.set(row.photoId, relFile);
      provenance.push({
        ...meta(row, sources),
        status: "acquired",
        path: publicPath(relFile),
        publicSrc: publicPath(relFile),
        sourceUrl: pageUrl(row.photoId),
        reusedExistingFile: true,
      });
      process.stdout.write("r");
      continue;
    }

    const url = unsplashUrl(row.photoId);
    let buffer;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "AlmahbubMediaStaging/1.0 (IE-IMAGE-02; licensed Unsplash use)",
          Accept: "image/*",
        },
      });
      if (!res.ok) {
        notFound.push({
          filename: row.filename,
          reason: `HTTP ${res.status}`,
          url,
          note: "NOT FOUND — MANUAL OWNER SOURCING REQUIRED",
        });
        provenance.push({
          ...meta(row, sources),
          status: "not_found",
          path: null,
          httpStatus: res.status,
        });
        continue;
      }
      buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 5_000) {
        rejected.push({
          filename: row.filename,
          reason: "response_too_small_possibly_error",
        });
        continue;
      }
    } catch (error) {
      notFound.push({
        filename: row.filename,
        reason: String(error),
        note: "NOT FOUND — MANUAL OWNER SOURCING REQUIRED",
      });
      continue;
    }

    const sha = crypto.createHash("sha256").update(buffer).digest("hex");
    if (hashCanonical.has(sha)) {
      const canonical = hashCanonical.get(sha);
      skipped.push({
        filename: row.filename,
        reason: "duplicate_bytes",
        aliasesTo: canonical,
      });
      provenance.push({
        ...meta(row, sources),
        status: "aliased",
        path: null,
        aliasesTo: canonical,
        sha256: sha,
      });
      photoCanonical.set(row.photoId, canonical);
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
      photoCanonical.set(row.photoId, relFile);
      hashCanonical.set(sha, relFile);
      hashCanonical.set(outSha, relFile);
      acquired.push({ filename: row.filename, path: relFile, bytes: webp.length });
      provenance.push({
        ...meta(row, sources),
        status: "acquired",
        path: publicPath(relFile),
        publicSrc: publicPath(relFile),
        sourceUrl: pageUrl(row.photoId),
        downloadUrl: url,
        sha256: outSha,
        bytes: webp.length,
      });
      process.stdout.write(".");
    } catch (error) {
      rejected.push({
        filename: row.filename,
        reason: `convert_failed: ${error}`,
      });
    }
  }

  const report = {
    phase: "IE-IMAGE-02",
    downloadDate: sources.downloadDate,
    acquired: acquired.length,
    skipped: skipped.length,
    rejected: rejected.length,
    notFound: notFound.length,
    details: { acquired, skipped, rejected, notFound },
  };

  const outDir = path.join(root, "docs");
  fs.writeFileSync(
    path.join(outDir, "ie-image-02-staging-report.json"),
    JSON.stringify(report, null, 2),
  );
  fs.writeFileSync(
    path.join(outDir, "ie-image-02-provenance.json"),
    JSON.stringify(
      {
        license: sources.license,
        licenseUrl: sources.licenseUrl,
        downloadDate: sources.downloadDate,
        assets: provenance,
      },
      null,
      2,
    ),
  );

  console.log("\n", JSON.stringify({
    acquired: acquired.length,
    skipped: skipped.length,
    rejected: rejected.length,
    notFound: notFound.length,
  }, null, 2));
}

function publicPath(relFile) {
  return `/${relFile.replace(/^apps\/web\/public\//, "").replaceAll("\\", "/")}`;
}

function meta(row, sources) {
  return {
    filename: row.filename,
    folder: row.folder,
    manifestId: row.manifestId,
    authenticity: row.authenticity,
    alt: row.alt,
    photographer: row.photographer,
    subject: row.subject,
    license: sources.license,
    licenseUrl: sources.licenseUrl,
    downloadDate: sources.downloadDate,
    photoId: row.photoId,
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
