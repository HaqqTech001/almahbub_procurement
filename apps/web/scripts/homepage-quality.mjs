/**
 * Homepage production quality capture - screenshots, axe a11y, viewport checks.
 * Run against vite preview at http://127.0.0.1:4173/
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const shotDir = join(root, "quality", "screenshots");
const reportDir = join(root, "quality", "reports");
mkdirSync(shotDir, { recursive: true });
mkdirSync(reportDir, { recursive: true });

const BASE = process.env.HAMD_WEB_URL ?? "http://127.0.0.1:4173/";

async function main() {
  const { chromium } = await import("playwright");
  const { AxeBuilder } = await import("@axe-core/playwright");

  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const viewports = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];

  const results = [];

  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector('[data-testid="homepage"]', { timeout: 30000 });
    // Ensure below-fold is present (eagerBelowFold)
    await page.waitForSelector("#services, #faq, #request-cta", { timeout: 30000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 400));

    await page.screenshot({
      path: join(shotDir, `homepage-${vp.name}-above-fold.png`),
      fullPage: false,
    });
    await page.screenshot({
      path: join(shotDir, `homepage-${vp.name}-full.png`),
      fullPage: true,
    });

    if (vp.name === "desktop") {
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise((r) => setTimeout(r, 400));
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      writeFileSync(
        join(reportDir, "accessibility-axe.json"),
        JSON.stringify(axe, null, 2),
      );
      const summary = {
        url: BASE,
        violations: axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
          helpUrl: v.helpUrl,
        })),
        passes: axe.passes.length,
        incomplete: axe.incomplete.length,
        violationCount: axe.violations.length,
      };
      writeFileSync(
        join(reportDir, "accessibility-summary.json"),
        JSON.stringify(summary, null, 2),
      );
      results.push({ axe: summary });
    }

    await context.close();
    results.push({ viewport: vp.name, ok: true });
  }

  await browser.close();
  writeFileSync(join(reportDir, "screenshot-run.json"), JSON.stringify(results, null, 2));
  console.log("Screenshots + a11y complete", results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
