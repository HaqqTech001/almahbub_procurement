/**
 * IE-IMAGE-02 validator — checks staged downloadAllowed assets vs deferred packs.
 * Usage: node scripts/validate-ie-image-staging.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function main() {
  const manifest = JSON.parse(
    fs.readFileSync(
      path.join(root, "docs/integrated-export-image-acquisition-manifest.json"),
      "utf8",
    ),
  );
  const provenance = JSON.parse(
    fs.readFileSync(path.join(root, "docs/ie-image-02-provenance.json"), "utf8"),
  );

  const allowed = new Set(manifest.validationIndex.allowedFilenamesNow);
  const deferred = new Set(
    manifest.validationIndex.deferredFilenamesUntilOwnerConfirmation,
  );

  const byFilename = new Map(
    provenance.assets.map((a) => [a.filename, a]),
  );

  const errors = [];
  const warnings = [];

  for (const filename of allowed) {
    const entry = byFilename.get(filename);
    if (!entry) {
      errors.push(`missing provenance for allowed asset: ${filename}`);
      continue;
    }
    if (entry.status === "acquired") {
      if (!entry.publicSrc && !entry.path) {
        errors.push(`acquired without path: ${filename}`);
        continue;
      }
      const publicSrc = String(entry.publicSrc || entry.path);
      const disk = path.join(root, "apps/web/public", publicSrc.replace(/^\//, ""));
      if (!fs.existsSync(disk)) {
        errors.push(`acquired file missing on disk: ${filename} -> ${disk}`);
      }
      if (!entry.license) errors.push(`missing license: ${filename}`);
      if (!entry.alt) errors.push(`missing alt: ${filename}`);
      if (!entry.sourceUrl && !entry.photographer) {
        warnings.push(`weak source attribution: ${filename}`);
      }
    } else if (entry.status === "aliased") {
      if (!entry.aliasesTo) {
        errors.push(`aliased without aliasesTo: ${filename}`);
      } else {
        const canonicalAbs = path.join(root, entry.aliasesTo);
        if (!fs.existsSync(canonicalAbs)) {
          errors.push(
            `alias target missing: ${filename} -> ${entry.aliasesTo}`,
          );
        }
      }
    } else if (entry.status === "not_found") {
      errors.push(`NOT FOUND still unresolved: ${filename}`);
    } else {
      errors.push(`unexpected status for ${filename}: ${entry.status}`);
    }
  }

  for (const filename of deferred) {
    const diskHits = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (name === filename) diskHits.push(full);
      }
    };
    walk(path.join(root, "apps/web/public/media/ie"));
    if (diskHits.length > 0) {
      errors.push(
        `deferred commodity asset accidentally staged: ${filename} at ${diskHits[0]}`,
      );
    }
  }

  const commoditiesDir = path.join(
    root,
    "apps/web/public/media/ie/commodities",
  );
  if (fs.existsSync(commoditiesDir)) {
    errors.push("ie/commodities folder must not exist while commodities are unapproved");
  }

  // Duplicate filename check among acquired files
  const seen = new Set();
  for (const a of provenance.assets.filter((x) => x.status === "acquired")) {
    if (seen.has(a.filename)) errors.push(`duplicate filename in provenance: ${a.filename}`);
    seen.add(a.filename);
  }

  const summary = {
    ok: errors.length === 0,
    errors,
    warnings,
    allowedCount: allowed.size,
    deferredCount: deferred.size,
    acquired: provenance.assets.filter((a) => a.status === "acquired").length,
    aliased: provenance.assets.filter((a) => a.status === "aliased").length,
  };

  fs.writeFileSync(
    path.join(root, "docs/ie-image-02-validation.json"),
    JSON.stringify(summary, null, 2),
  );

  if (!summary.ok) {
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify(summary, null, 2));
}

main();
