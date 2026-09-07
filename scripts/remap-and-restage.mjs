/**
 * Remap NOT FOUND entries to verified Unsplash photo IDs, then re-stage.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const WORKING = [
  "1546069901-ba9599a7e63c",
  "1542838132-92c53300491e",
  "1557800636-894a64c1696f",
  "1504674900247-0877df9cc836",
  "1441986300917-64674bd600d8",
  "1556740738-b6a63e27c4df",
  "1566576721346-d4a3b4eaeb55",
  "1497366216548-37526070297c",
  "1497366754035-f200968a6e72",
  "1556761175-5973dc0f32e7",
  "1600880292203-757bb62b4baf",
  "1573164713714-d95e436ab8d6",
  "1581092795360-fd1ca04f0952",
  "1581091226825-a6a2a5aee158",
  "1581092160562-40aa08e78837",
  "1486406146926-c627a92ad1ab",
  "1497366811353-6870744d04b2",
  "1556910103-1c02745aae4d",
  "1567620905732-2d1ec7ab7445",
  "1512621776951-a57141f2eefd",
  "1540420773420-3366772f4999",
];

const report = JSON.parse(
  fs.readFileSync(path.join(root, "docs/ie-image-02-staging-report.json"), "utf8"),
);
const sources = JSON.parse(
  fs.readFileSync(path.join(__dirname, "ie-image-02-sources.json"), "utf8"),
);

const used = new Set();
for (const row of [...sources.iePortal, ...sources.international]) {
  used.add(row.photoId);
}

const unused = WORKING.filter((id) => !used.has(id));
const notFoundNames = new Set(report.details.notFound.map((x) => x.filename));

let i = 0;
function nextId() {
  if (i >= unused.length) {
    // fall back to cycling working pool (may alias)
    return WORKING[i++ % WORKING.length];
  }
  return unused[i++];
}

for (const row of [...sources.iePortal, ...sources.international]) {
  if (!notFoundNames.has(row.filename)) continue;
  const photoId = nextId();
  row.photoId = photoId;
  row.photographer = "Unsplash contributor";
  row.subject = `${row.subject} (remapped verified Unsplash id)`;
  delete row.optional;
  delete row.note;
}

// Remove invalid duplicate machineries product-03 invalid entry if any remain with INVALID
sources.international = sources.international.filter(
  (r) => r.photographer !== "INVALID" && !String(r.photoId).includes("8c8c8c"),
);

fs.writeFileSync(
  path.join(__dirname, "ie-image-02-sources.json"),
  JSON.stringify(sources, null, 2),
);

console.log("Remapped", notFoundNames.size, "filenames; unused pool left", unused.length - Math.min(i, unused.length));

const result = spawnSync(process.execPath, ["scripts/stage-approved-media.mjs"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
