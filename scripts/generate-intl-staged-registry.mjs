/**
 * Generates apps/web/src/content/international-category-staged-media.ts
 * from docs/ie-image-02-provenance.json (acquired International assets only).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const provenance = JSON.parse(
  fs.readFileSync(path.join(root, "docs/ie-image-02-provenance.json"), "utf8"),
);

const acquired = provenance.assets.filter(
  (a) => a.status === "acquired" && a.filename.startsWith("intl-"),
);

/** @type {Record<string, typeof acquired>} */
const byCat = {};
for (const a of acquired) {
  const slug = String(a.publicSrc).split("/categories/")[1].split("/")[0];
  (byCat[slug] ??= []).push(a);
}

const lines = [
  "/**",
  " * IE-IMAGE-02 International category extras (acquired WebP).",
  " * Generated from docs/ie-image-02-provenance.json — do not hand-edit filenames.",
  " * Does not replace INTERNATIONAL_CATEGORY_MEDIA primary JPGs.",
  " */",
  'import type { MediaAsset } from "./media-assets.js";',
  "",
  "export const INTERNATIONAL_CATEGORY_STAGED_MEDIA = {",
];

for (const [slug, assets] of Object.entries(byCat)) {
  lines.push(`  "${slug}": [`);
  for (const a of assets) {
    const auth =
      a.authenticity === "contextual" ? "contextual" : "representative";
    const source = `Unsplash — ${a.photographer || "contributor"}${
      a.photoId ? `, photo-${a.photoId}` : ""
    }`;
    lines.push("    {");
    lines.push(`      id: ${JSON.stringify(a.manifestId)},`);
    lines.push(`      src: ${JSON.stringify(a.publicSrc)},`);
    lines.push(`      alt: ${JSON.stringify(a.alt)},`);
    lines.push('      kind: "representative" as const,');
    lines.push(`      authenticity: "${auth}" as const,`);
    lines.push(
      `      subject: ${JSON.stringify(a.subject || a.filename)},`,
    );
    lines.push(`      source: ${JSON.stringify(source)},`);
    lines.push('      license: "Unsplash License",');
    lines.push('      licenseUrl: "https://unsplash.com/license",');
    lines.push('      downloadDate: "2026-08-17",');
    lines.push('      usedOn: ["/", "/products"] as const,');
    lines.push("    },");
  }
  lines.push("  ],");
}

lines.push(
  "} as const satisfies Record<string, readonly MediaAsset[]>;",
  "",
  "export function listInternationalStagedMedia(",
  "  slug: string,",
  "): readonly MediaAsset[] {",
  "  return (",
  "    INTERNATIONAL_CATEGORY_STAGED_MEDIA[",
  "      slug as keyof typeof INTERNATIONAL_CATEGORY_STAGED_MEDIA",
  "    ] ?? []",
  "  );",
  "}",
  "",
);

const out = path.join(
  root,
  "apps/web/src/content/international-category-staged-media.ts",
);
fs.writeFileSync(out, lines.join("\n"));
console.log(
  "Wrote",
  out,
  Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, v.length])),
);
