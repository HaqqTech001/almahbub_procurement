import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import console from "node:console";
import process from "node:process";
import { config } from "dotenv";
import { auditCatalogue } from "../../dist/modules/catalog/application/catalogue-audit.js";
import { inspectProductMedia, withConcurrency } from "../../dist/modules/catalog/infrastructure/product-media-health.js";

config({ path: "apps/api/.env", quiet: true });
const snapshot = JSON.parse(await readFile("database/audits/catalogue-snapshot.local.json", "utf8"));
const sources = [...new Set(snapshot.products.flatMap(row => row.images.map(image => image.url)))];
const uploadRoot = resolve("apps/api", process.env.UPLOAD_ROOT || "uploads");
const checks = await withConcurrency(sources, async source => [source, await inspectProductMedia(source, uploadRoot)]);
const audit = auditCatalogue(snapshot.products, new Map(checks));
const report = {
  capturedAt: snapshot.capturedAt, auditedAt: new Date().toISOString(),
  source: "Live database read-only snapshot; no product or schema changes",
  mediaVerification: "Local file/remote public GET, image MIME and signature. Browser decode is the final display check. Network failures are unverified, never evidence for deletion. Local results apply only to this machine, not hosted disk.",
  ...audit,
};
await writeFile("database/audits/catalogue-audit.json", JSON.stringify(report, null, 2) + "\n");
const columns = ["productId", "productName", "slug", "category", "publishedStatus", "hasValidPrimaryImage", "classification", "classificationReason", "mediaHealth", "duplicateOf"];
const cell = value => `"${String(value ?? "").replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
await writeFile("database/audits/catalogue-audit.csv", [columns.join(","), ...audit.rows.map(row => columns.map(key => cell(row[key])).join(","))].join("\n") + "\n");
const examples = ["KEEP_PRIORITY", "KEEP_NEEDS_MEDIA", "ARCHIVE", "DELETE_CANDIDATE"].map(group => `### ${group}\n\n${audit.rows.filter(row => row.classification === group).slice(0, 5).map(row => `- ${row.productName} (${row.slug}): ${row.classificationReason}`).join("\n") || "None."}`);
await writeFile("database/audits/catalogue-audit.md", `# V2 catalogue audit\n\nSnapshot: ${snapshot.capturedAt}\n\nNo database changes. Classifications are proposals; delete candidates are not confirmed deletions.\n\n${Object.entries(audit.summary).map(([key, value]) => `- ${key}: ${value}`).join("\n")}\n\n${examples.join("\n\n")}\n`);
console.log(JSON.stringify(audit.summary, null, 2));
