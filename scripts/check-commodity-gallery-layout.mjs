/**
 * Viewport check for the 7 public IE commodity detail galleries.
 * Usage: node scripts/check-commodity-gallery-layout.mjs
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(
  join(dirname(fileURLToPath(import.meta.url)), "../apps/web/package.json"),
);
const { chromium } = require("playwright");

const SLUGS = ["sesame-seeds", "cashew", "ginger", "hibiscus", "shea", "soybean", "cocoa"];
const WIDTHS = [375, 430, 768, 1280, 1440];
const BASE = "http://127.0.0.1:3000/businesses/almahbub-integrated-export/commodities";

const browser = await chromium.launch({ headless: true });
const results = [];

for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const slug of SLUGS) {
    await page.goto(`${BASE}/${slug}`, { waitUntil: "networkidle", timeout: 45000 });
    const row = await page.evaluate((viewWidth) => {
      const gallery = document.querySelector(".hamd-aie-commodity-detail__gallery");
      const doc = document.documentElement;
      const scrollWidth = Math.max(doc.scrollWidth, document.body.scrollWidth);
      const overflowX = scrollWidth > viewWidth + 1;
      if (!gallery) {
        return { hasGallery: false, overflowX, edgeTouch: false, overlap: false, tiles: 0 };
      }
      const rect = gallery.getBoundingClientRect();
      const styles = getComputedStyle(gallery);
      const padLeft = parseFloat(getComputedStyle(document.querySelector(".hamd-aie-commodity-detail"))?.paddingLeft ?? "0");
      const edgeTouch = rect.left < 8 || rect.right > viewWidth - 8;
      const tiles = [...gallery.querySelectorAll(".hamd-aie-commodity-detail__gallery-item, .hamd-aie-commodity-detail__gallery > li")];
      let overlap = false;
      for (let i = 0; i < tiles.length; i += 1) {
        const a = tiles[i].getBoundingClientRect();
        for (let j = i + 1; j < tiles.length; j += 1) {
          const b = tiles[j].getBoundingClientRect();
          const hit = a.right > b.left + 1 && a.left < b.right - 1 && a.bottom > b.top + 1 && a.top < b.bottom - 1;
          if (hit) overlap = true;
        }
      }
      const wideMedia = [...gallery.querySelectorAll("img")].some((img) => img.getBoundingClientRect().width > viewWidth + 1);
      return {
        hasGallery: true,
        overflowX,
        edgeTouch: edgeTouch || wideMedia,
        overlap,
        tiles: tiles.length,
        columns: styles.gridTemplateColumns,
        padLeft,
        galleryLeft: Math.round(rect.left),
        galleryRight: Math.round(rect.right),
      };
    }, width);
    results.push({ width, slug, ...row });
  }
  await page.close();
}

await browser.close();

const failed = results.filter((row) => row.overflowX || row.edgeTouch || row.overlap);
console.log(JSON.stringify({ ok: failed.length === 0, checked: results.length, failed, results }, null, 2));
if (failed.length > 0) process.exitCode = 1;
