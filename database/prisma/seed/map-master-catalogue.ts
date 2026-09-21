import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

type EntryType =
  | "STANDARD_PRODUCT"
  | "PRODUCT_FAMILY"
  | "PROCUREMENT_SERVICE"
  | "CONFIGURABLE_PRODUCT";
type Availability = "ON_REQUEST" | "COMING_SOON" | "PRE_ORDER" | "OUT_OF_STOCK";

type ManifestVariant = Record<string, unknown> & { name: string };
type ManifestEntry = {
  catalogueId: string;
  ordinal: number;
  slug: string;
  name: string;
  category: string;
  entryType: EntryType;
  manufacturer?: string | null;
  variants: ManifestVariant[];
  summary: string;
  keySpecs: Record<string, unknown>;
  availabilityStatus: Availability;
  releaseDate?: string | null;
  manufacturerUrl?: string | null;
  verificationStatus: string;
  heroImagePolicy: string;
  mediaStatus: string;
  searchAliases?: string[];
  notes?: string | null;
};
type Manifest = {
  catalogueVersion: string;
  generatedFor: string;
  generatedOn: string;
  status: string;
  catalogueRules: Record<string, unknown>;
  categories: string[];
  entries: ManifestEntry[];
};

type DbProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  categorySlug: string | null;
  categoryName: string | null;
  manufacturerName: string | null;
  brandName: string | null;
};
type DbVariant = { id: string; productId: string; name: string; specifications: unknown };
type DbImage = { id: string; productId: string; url: string; storageKey: string | null; position: number; isPrimary: boolean };
type RefCount = { productId: string; count: number };

type Queryable = {
  query<T = Record<string, unknown>>(sql: string, params?: readonly unknown[]): Promise<{ rows: T[] }>;
};

export type ValidationResult = {
  manifest: Manifest | null;
  errors: string[];
  warnings: string[];
};

export type Candidate = DbProduct & {
  matchStatus: "EXACT_SLUG_MATCH" | "ALIAS_MATCH" | "MANUAL_REVIEW";
  score: number;
  variants: DbVariant[];
  images: DbImage[];
  requestItemReferences: number;
  quotationItemReferences: number;
};

export type CompatibilityRow = {
  catalogueId: string;
  manifestSlug: string;
  manifestName: string;
  entryType: EntryType;
  category: string;
  mappingStatus:
    | "EXACT_SLUG_MATCH"
    | "ALIAS_MATCH"
    | "MANUAL_REVIEW"
    | "CREATE_NEW_DRAFT"
    | "FAMILY_ALREADY_MODELED"
    | "SEPARATE_PRODUCTS_NEED_CONSOLIDATION"
    | "PARTIAL_FAMILY_MATCH"
    | "NO_FAMILY_MATCH";
  existingCandidates: Array<{
    productId: string;
    slug: string;
    name: string;
    status: string;
    categorySlug: string | null;
    manufacturerName: string | null;
    brandName: string | null;
    matchStatus: Candidate["matchStatus"];
    score: number;
    variantCount: number;
    imageCount: number;
    requestItemReferences: number;
    quotationItemReferences: number;
  }>;
  variantAnalysis: Array<{
    manifestVariant: string;
    matchingExistingProducts: string[];
    status: "MATCHED" | "SEPARATE_PRODUCT" | "UNMATCHED";
  }>;
  mediaStatus: "MEDIA_REUSABLE" | "MEDIA_PRESENT_NEEDS_REVIEW" | "FAMILY_HERO_REQUIRED" | "SERVICE_VISUAL_REQUIRED" | "MEDIA_MISSING";
  mediaDetails: Array<{ productId: string; count: number; urls: string[]; exactRecord: boolean }>;
  historicalReferenceRisk: "SAFE_NO_REFERENCES" | "HAS_HISTORICAL_REFERENCES";
  recommendedAction: "REUSE_AFTER_REVIEW" | "MANUAL_REVIEW" | "CREATE_NEW_DRAFT" | "CONSOLIDATE_AFTER_REVIEW";
  contentStatus: "CONTENT_REUSABLE" | "CONTENT_PARTIAL" | "CONTENT_MISSING" | "CONTENT_CONFLICT";
  notes: string[];
};

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const MANIFEST_PATH = join(ROOT, "docs", "catalogue", "master-catalogue.json");
const REPORT_DIR = join(ROOT, "docs", "catalogue", "reports");
const ALIAS_PATH = join(ROOT, "docs", "catalogue", "catalogue-aliases.json");
const ENTRY_TYPES = new Set<EntryType>([
  "STANDARD_PRODUCT",
  "PRODUCT_FAMILY",
  "PROCUREMENT_SERVICE",
  "CONFIGURABLE_PRODUCT",
]);
const AVAILABILITY = new Set<Availability>([
  "ON_REQUEST",
  "COMING_SOON",
  "PRE_ORDER",
  "OUT_OF_STOCK",
]);
const PROHIBITED_CATEGORY_8 = /uniform|textile|fabric|linen|workwear|school|corporate|hospital|hospitality/i;

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function tokens(value: string): Set<string> {
  return new Set(normalize(value).split(/\s+/).filter((item) => item.length > 2));
}
function overlapScore(a: string, b: string): number {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return Math.round((shared / Math.max(left.size, right.size)) * 100);
}

export function validateMasterManifest(value: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!isRecord(value)) return { manifest: null, errors: ["Manifest root must be an object."], warnings };
  const manifest = value as Partial<Manifest>;
  if (!text(manifest.catalogueVersion)) errors.push("catalogueVersion is required.");
  if (!Array.isArray(manifest.categories)) errors.push("categories must be an array.");
  if (!Array.isArray(manifest.entries)) errors.push("entries must be an array.");
  const categories = Array.isArray(manifest.categories) ? manifest.categories : [];
  const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
  if (categories.length !== 10) errors.push(`Expected exactly 10 categories; received ${categories.length}.`);
  if (entries.length !== 100) errors.push(`Expected exactly 100 entries; received ${entries.length}.`);
  const categorySet = new Set<string>();
  for (const category of categories) {
    if (typeof category !== "string" || !category.trim()) errors.push("Every category must be a non-empty string.");
    else if (categorySet.has(category)) errors.push(`Duplicate category: ${category}.`);
    else categorySet.add(category);
  }
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const parsed: ManifestEntry[] = [];
  for (let index = 0; index < entries.length; index += 1) {
    const raw = entries[index];
    if (!isRecord(raw)) { errors.push(`Entry ${index + 1} must be an object.`); continue; }
    const id = text(raw.catalogueId);
    const slug = text(raw.slug);
    const name = text(raw.name);
    const category = text(raw.category);
    const entryType = raw.entryType;
    if (!id) errors.push(`Entry ${index + 1}: catalogueId is required.`);
    if (id && ids.has(id)) errors.push(`Duplicate catalogueId: ${id}.`); else if (id) ids.add(id);
    if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) errors.push(`Entry ${id || index + 1}: slug must be lowercase kebab-case.`);
    if (slug && slugs.has(slug)) errors.push(`Duplicate slug: ${slug}.`); else if (slug) slugs.add(slug);
    if (!name) errors.push(`Entry ${id || index + 1}: name is required.`);
    if (!categorySet.has(category)) errors.push(`Entry ${id || index + 1}: unknown category ${category || "(empty)"}.`);
    if (typeof entryType !== "string" || !ENTRY_TYPES.has(entryType as EntryType)) errors.push(`Entry ${id || index + 1}: unsupported entryType ${String(entryType)}.`);
    const variants = Array.isArray(raw.variants) ? raw.variants : null;
    if (!variants) errors.push(`Entry ${id || index + 1}: variants must be an array.`);
    const seenVariants = new Set<string>();
    for (const variant of variants ?? []) {
      if (!isRecord(variant) || !text(variant.name)) errors.push(`Entry ${id || index + 1}: every variant requires a name.`);
      else if (seenVariants.has(text(variant.name))) errors.push(`Entry ${id || index + 1}: duplicate variant ${text(variant.name)}.`);
      else seenVariants.add(text(variant.name));
    }
    if (entryType === "PRODUCT_FAMILY" && (variants?.length ?? 0) === 0) errors.push(`Entry ${id}: PRODUCT_FAMILY requires at least one variant.`);
    if (entryType === "PROCUREMENT_SERVICE" && variants && variants.length > 0) errors.push(`Entry ${id}: PROCUREMENT_SERVICE must not define product variants.`);
    if (entryType === "CONFIGURABLE_PRODUCT" && (variants?.length ?? 0) === 0) warnings.push(`Entry ${id}: configurable product has no predefined variants and is specification-driven.`);
    if (!text(raw.summary)) errors.push(`Entry ${id || index + 1}: summary is required.`);
    if (!isRecord(raw.keySpecs)) errors.push(`Entry ${id || index + 1}: keySpecs must be an object.`);
    if (!AVAILABILITY.has(raw.availabilityStatus as Availability)) errors.push(`Entry ${id || index + 1}: invalid availabilityStatus ${String(raw.availabilityStatus)}.`);
    if (!text(raw.verificationStatus)) errors.push(`Entry ${id || index + 1}: verificationStatus is required.`);
    if (!text(raw.heroImagePolicy)) errors.push(`Entry ${id || index + 1}: heroImagePolicy is required.`);
    if (!text(raw.mediaStatus)) errors.push(`Entry ${id || index + 1}: mediaStatus is required.`);
    parsed.push({
      catalogueId: id, ordinal: Number(raw.ordinal), slug, name, category,
      entryType: entryType as EntryType, manufacturer: text(raw.manufacturer) || null,
      variants: (variants ?? []) as ManifestVariant[], summary: text(raw.summary),
      keySpecs: (raw.keySpecs as Record<string, unknown>) ?? {},
      availabilityStatus: raw.availabilityStatus as Availability,
      releaseDate: text(raw.releaseDate) || null, manufacturerUrl: text(raw.manufacturerUrl) || null,
      verificationStatus: text(raw.verificationStatus), heroImagePolicy: text(raw.heroImagePolicy),
      mediaStatus: text(raw.mediaStatus), searchAliases: stringArray(raw.searchAliases), notes: text(raw.notes) || null,
    });
  }
  return { manifest: errors.length ? null : { ...(manifest as Manifest), categories, entries: parsed }, errors, warnings };
}

function aliases(): Record<string, string> {
  if (!existsSync(ALIAS_PATH)) return {};
  const value = readJson(ALIAS_PATH);
  if (!isRecord(value)) throw new Error("catalogue-aliases.json must contain an object.");
  return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, text(val)]).filter(([, val]) => val));
}

async function selectRows(db: Queryable) {
  const products = await db.query<DbProduct>(`SELECT p.id::text AS id, p.slug::text AS slug, p.name, p.description, p.status::text AS status, pc.slug::text AS "categorySlug", pc.name AS "categoryName", m.legal_name AS "manufacturerName", b.name AS "brandName" FROM products p LEFT JOIN product_categories pc ON pc.id = p.category_id LEFT JOIN manufacturers m ON m.id = p.manufacturer_id LEFT JOIN brands b ON b.id = p.brand_id ORDER BY p.slug`);
  const variants = await db.query<DbVariant>(`SELECT id::text, product_id::text AS "productId", name, specifications FROM product_variants ORDER BY product_id, created_at, id`);
  const images = await db.query<DbImage>(`SELECT id::text, product_id::text AS "productId", url, storage_key AS "storageKey", position, is_primary AS "isPrimary" FROM product_images ORDER BY product_id, position, id`);
  const requestRefs = await db.query<RefCount>(`SELECT product_variant_id::text AS "productId", count(*)::int AS count FROM procurement_request_items WHERE product_variant_id IS NOT NULL GROUP BY product_variant_id`);
  const quoteRefs = await db.query<RefCount>(`SELECT product_variant_id::text AS "productId", count(*)::int AS count FROM quotation_items WHERE product_variant_id IS NOT NULL GROUP BY product_variant_id`);
  const manufacturers = await db.query<{ legalName: string }>(`SELECT legal_name AS "legalName" FROM manufacturers ORDER BY legal_name`);
  const brands = await db.query<{ name: string }>(`SELECT name FROM brands ORDER BY name`);
  return { products: products.rows, variants: variants.rows, images: images.rows, requestRefs: requestRefs.rows, quoteRefs: quoteRefs.rows, manufacturers: manufacturers.rows, brands: brands.rows };
}

function productRefCount(productId: string, variants: DbVariant[], refs: RefCount[]): number {
  const ids = new Set(variants.filter((variant) => variant.productId === productId).map((variant) => variant.id));
  return refs.filter((ref) => ids.has(ref.productId)).reduce((sum, ref) => sum + ref.count, 0);
}

function candidateView(candidate: Candidate) {
  return { productId: candidate.id, slug: candidate.slug, name: candidate.name, status: candidate.status, categorySlug: candidate.categorySlug, manufacturerName: candidate.manufacturerName, brandName: candidate.brandName, matchStatus: candidate.matchStatus, score: candidate.score, variantCount: candidate.variants.length, imageCount: candidate.images.length, requestItemReferences: candidate.requestItemReferences, quotationItemReferences: candidate.quotationItemReferences };
}

function familyStatus(entry: ManifestEntry, candidates: Candidate[]): CompatibilityRow["mappingStatus"] {
  if (!candidates.length) return "NO_FAMILY_MATCH";
  const names = candidates.flatMap((candidate) => [candidate.name, ...candidate.variants.map((variant) => variant.name)]).join(" ").toLowerCase();
  const matched = entry.variants.filter((variant) => names.includes(variant.name.toLowerCase())).length;
  if (candidates.length === 1 && matched === entry.variants.length && candidates[0]!.variants.length >= entry.variants.length) return "FAMILY_ALREADY_MODELED";
  if (matched > 0 && matched < entry.variants.length) return "PARTIAL_FAMILY_MATCH";
  if (candidates.length > 1) return "SEPARATE_PRODUCTS_NEED_CONSOLIDATION";
  return "MANUAL_REVIEW";
}

export function classifyCategory8(name: string): "KEEP_AND_MAP" | "LEGACY_ARCHIVE_CANDIDATE" | "MANUAL_REVIEW" {
  if (PROHIBITED_CATEGORY_8.test(name)) return "LEGACY_ARCHIVE_CANDIDATE";
  if (/shoe|footwear|sandal|boot|sneaker|loafer|bag|luggage|watch|wallet|belt|accessory|fashion|dress|gown|jacket|coat/i.test(name)) return "KEEP_AND_MAP";
  return "MANUAL_REVIEW";
}

export function mapManifestEntry(entry: ManifestEntry, data: Awaited<ReturnType<typeof selectRows>>, aliasMap: Record<string, string>): CompatibilityRow {
  const byId = new Map(data.products.map((product) => [product.id, product]));
  const variantsByProduct = new Map<string, DbVariant[]>();
  for (const variant of data.variants) variantsByProduct.set(variant.productId, [...(variantsByProduct.get(variant.productId) ?? []), variant]);
  const imagesByProduct = new Map<string, DbImage[]>();
  for (const image of data.images) imagesByProduct.set(image.productId, [...(imagesByProduct.get(image.productId) ?? []), image]);
  const reqRefByVariant = new Map(data.requestRefs.map((row) => [row.productId, row.count]));
  const quoteRefByVariant = new Map(data.quoteRefs.map((row) => [row.productId, row.count]));
  const build = (product: DbProduct, matchStatus: Candidate["matchStatus"], score: number): Candidate => ({ ...product, matchStatus, score, variants: variantsByProduct.get(product.id) ?? [], images: imagesByProduct.get(product.id) ?? [], requestItemReferences: productRefCount(product.id, variantsByProduct.get(product.id) ?? [], data.requestRefs), quotationItemReferences: productRefCount(product.id, variantsByProduct.get(product.id) ?? [], data.quoteRefs) });
  const exact = data.products.find((product) => product.slug.toLowerCase() === entry.slug.toLowerCase());
  const aliasSlugs = Object.entries(aliasMap).filter(([, target]) => target === entry.slug).map(([legacy]) => legacy.toLowerCase());
  const aliasCandidates = data.products.filter((product) => aliasSlugs.includes(product.slug.toLowerCase())).map((product) => build(product, "ALIAS_MATCH", 100));
  const manualCandidates = entry.entryType === "PROCUREMENT_SERVICE" ? [] : data.products.map((product) => ({ product, score: overlapScore(entry.name, product.name) })).filter(({ product, score }) => score >= 65 && product.slug !== entry.slug).sort((a, b) => b.score - a.score || a.product.slug.localeCompare(b.product.slug)).slice(0, 5).map(({ product, score }) => build(product, "MANUAL_REVIEW", score));
  const candidates = exact ? [build(exact, "EXACT_SLUG_MATCH", 100)] : aliasCandidates.length ? aliasCandidates : manualCandidates;
  const views = candidates.map(candidateView);
  const references = candidates.reduce((sum, candidate) => sum + candidate.requestItemReferences + candidate.quotationItemReferences, 0);
  const primaryCandidates = candidates.filter((candidate) => candidate.images.length > 0);
  let mediaStatus: CompatibilityRow["mediaStatus"] = "MEDIA_MISSING";
  if (entry.entryType === "PROCUREMENT_SERVICE") mediaStatus = "SERVICE_VISUAL_REQUIRED";
  else if (entry.entryType === "PRODUCT_FAMILY") mediaStatus = primaryCandidates.length ? "MEDIA_PRESENT_NEEDS_REVIEW" : "FAMILY_HERO_REQUIRED";
  else if (primaryCandidates.length) mediaStatus = candidates.some((candidate) => candidate.matchStatus === "EXACT_SLUG_MATCH") ? "MEDIA_REUSABLE" : "MEDIA_PRESENT_NEEDS_REVIEW";
  const contentStatus = exact ? (exact.name === entry.name && Boolean(exact.description) && (variantsByProduct.get(exact.id)?.length ?? 0) > 0 ? "CONTENT_REUSABLE" : exact.description ? "CONTENT_PARTIAL" : "CONTENT_MISSING") : "CONTENT_MISSING";
  const mappingStatus = entry.entryType === "PRODUCT_FAMILY" ? familyStatus(entry, candidates) : exact ? "EXACT_SLUG_MATCH" : aliasCandidates.length ? "ALIAS_MATCH" : manualCandidates.length ? "MANUAL_REVIEW" : "CREATE_NEW_DRAFT";
  const notes: string[] = [];
  if (entry.entryType === "CONFIGURABLE_PRODUCT" && entry.variants.length === 0) notes.push("Specification-driven configurable entry; no variants invented.");
  if (entry.entryType === "PROCUREMENT_SERVICE") notes.push("Service entry is intentionally not matched to physical products.");
  if (references > 0) notes.push("Existing procurement or quotation references require preservation.");
  const recommendedAction: CompatibilityRow["recommendedAction"] = references > 0
    ? "MANUAL_REVIEW"
    : mappingStatus === "SEPARATE_PRODUCTS_NEED_CONSOLIDATION"
      ? "CONSOLIDATE_AFTER_REVIEW"
      : mappingStatus === "PARTIAL_FAMILY_MATCH" || mappingStatus === "MANUAL_REVIEW"
        ? "MANUAL_REVIEW"
        : exact || aliasCandidates.length || mappingStatus === "FAMILY_ALREADY_MODELED"
          ? "REUSE_AFTER_REVIEW"
          : "CREATE_NEW_DRAFT";
  return { catalogueId: entry.catalogueId, manifestSlug: entry.slug, manifestName: entry.name, entryType: entry.entryType, category: entry.category, mappingStatus, existingCandidates: views, variantAnalysis: entry.variants.map((variant) => { const matching = candidates.filter((candidate) => candidate.name.toLowerCase().includes(variant.name.toLowerCase()) || candidate.variants.some((existing) => existing.name.toLowerCase() === variant.name.toLowerCase())).map((candidate) => candidate.id); return { manifestVariant: variant.name, matchingExistingProducts: matching, status: matching.length ? (candidates.length > 1 ? "SEPARATE_PRODUCT" : "MATCHED") : "UNMATCHED" }; }), mediaStatus, mediaDetails: primaryCandidates.map((candidate) => ({ productId: candidate.id, count: candidate.images.length, urls: candidate.images.map((image) => image.url), exactRecord: candidate.matchStatus === "EXACT_SLUG_MATCH" })), historicalReferenceRisk: references > 0 ? "HAS_HISTORICAL_REFERENCES" : "SAFE_NO_REFERENCES", recommendedAction, contentStatus, notes };
}

function loadEnvironment(): void {
  if (process.env.DATABASE_URL || process.env.MIGRATION_DATABASE_URL) return;
  const envPath = join(ROOT, "apps", "api", ".env");
  if (existsSync(envPath) && typeof process.loadEnvFile === "function") process.loadEnvFile(envPath);
}

export async function runMapper(): Promise<{ validation: ValidationResult; rows: CompatibilityRow[] }> {
  const validation = validateMasterManifest(readJson(MANIFEST_PATH));
  if (!validation.manifest) return { validation, rows: [] };
  const manifest = validation.manifest;
  const aliasMap = aliases();
  loadEnvironment();
  const connectionString = process.env.DATABASE_URL ?? process.env.MIGRATION_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL or MIGRATION_DATABASE_URL is required for catalogue mapping.");
  const pool = new pg.Pool({ connectionString });
  try {
    const data = await selectRows(pool);
    const rows = manifest.entries.map((entry) => mapManifestEntry(entry, data, aliasMap));
    const variantsByProduct = new Map<string, DbVariant[]>();
    for (const variant of data.variants) variantsByProduct.set(variant.productId, [...(variantsByProduct.get(variant.productId) ?? []), variant]);
    const imagesByProduct = new Map<string, DbImage[]>();
    for (const image of data.images) imagesByProduct.set(image.productId, [...(imagesByProduct.get(image.productId) ?? []), image]);
    const productStatuses = data.products.reduce((acc, product) => { acc[product.status] = (acc[product.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    const report = { manifestVersion: validation.manifest.catalogueVersion, generatedAt: new Date().toISOString(), validation: { errors: validation.errors, warnings: validation.warnings }, databaseMutations: 0, rows, databaseSummary: { products: data.products.length, productStatuses, variants: data.variants.length, images: data.images.length, manufacturers: data.manufacturers.length, brands: data.brands.length }, manufacturerMapping: validation.manifest.entries.reduce((acc, entry) => { if (entry.manufacturer) acc[entry.manufacturer] = data.manufacturers.some((row) => row.legalName.toLowerCase() === entry.manufacturer!.toLowerCase()) ? "EXACT_MATCH" : "MISSING"; return acc; }, {} as Record<string, string>), presentManufacturers: data.manufacturers.map((row) => row.legalName), presentBrands: data.brands.map((row) => row.name), category8Audit: data.products.filter((product) => product.categorySlug === "fashion-textiles").map((product) => ({ productId: product.id, slug: product.slug, name: product.name, status: product.status, variantCount: (variantsByProduct.get(product.id) ?? []).length, imageCount: (imagesByProduct.get(product.id) ?? []).length, requestItemReferences: productRefCount(product.id, variantsByProduct.get(product.id) ?? [], data.requestRefs), quotationItemReferences: productRefCount(product.id, variantsByProduct.get(product.id) ?? [], data.quoteRefs), classification: classifyCategory8(product.name) })) };
    mkdirSync(REPORT_DIR, { recursive: true });
    writeFileSync(join(REPORT_DIR, "catalogue-compatibility-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    writeFileSync(join(REPORT_DIR, "manifest-validation-report.json"), `${JSON.stringify({ manifestVersion: manifest.catalogueVersion, entryCount: manifest.entries.length, categoryCount: manifest.categories.length, typeCounts: Object.fromEntries([...new Set(manifest.entries.map((entry) => entry.entryType))].map((type) => [type, manifest.entries.filter((entry) => entry.entryType === type).length])), duplicateCount: 0, errors: validation.errors, warnings: validation.warnings }, null, 2)}\n`, "utf8");
    writeFileSync(join(REPORT_DIR, "catalogue-compatibility-report.md"), markdownReport(report), "utf8");
    console.log(summary(report));
    return { validation, rows };
  } finally { await pool.end(); }
}

function markdownReport(report: any): string {
  const rows: CompatibilityRow[] = report.rows;
  const count = (predicate: (row: CompatibilityRow) => boolean) => rows.filter(predicate).length;
  const families = rows.filter((row) => row.entryType === "PRODUCT_FAMILY");
  const services = rows.filter((row) => row.entryType === "PROCUREMENT_SERVICE");
  const category8 = report.category8Audit as Array<{ name: string; classification: string; variantCount?: number; imageCount?: number; requestItemReferences?: number; quotationItemReferences?: number }>;
  return `# Master Catalogue Compatibility Report\n\nGenerated: ${report.generatedAt}\n\n## Manifest\n\n- Entries: ${rows.length}\n- Categories: 10\n- Validation errors: ${report.validation.errors.length}\n- Validation warnings: ${report.validation.warnings.length}\n- Database mutations: 0\n\n## Existing Database\n\n- Products: ${report.databaseSummary.products}\n- Product statuses: ${Object.entries(report.databaseSummary.productStatuses).map(([status, count]) => `${status}=${count}`).join(", ")}\n- Variants: ${report.databaseSummary.variants}\n- Images: ${report.databaseSummary.images}\n- Manufacturers: ${report.databaseSummary.manufacturers}\n- Brands: ${report.databaseSummary.brands}\n\n## Mapping Summary\n\n- Exact slug matches: ${count((row) => row.mappingStatus === "EXACT_SLUG_MATCH" || row.mappingStatus === "FAMILY_ALREADY_MODELED")}\n- Alias matches: ${count((row) => row.mappingStatus === "ALIAS_MATCH")}\n- Manual review: ${count((row) => row.mappingStatus === "MANUAL_REVIEW" || row.mappingStatus === "PARTIAL_FAMILY_MATCH")}\n- Create new draft: ${count((row) => row.mappingStatus === "CREATE_NEW_DRAFT" || row.mappingStatus === "NO_FAMILY_MATCH")}\n- Family consolidation candidates: ${count((row) => row.mappingStatus === "SEPARATE_PRODUCTS_NEED_CONSOLIDATION")}\n\n## Risk Summary\n\n- Historical references: ${count((row) => row.historicalReferenceRisk === "HAS_HISTORICAL_REFERENCES")}\n- Category 8 legacy archive candidates: ${category8.filter((row) => row.classification === "LEGACY_ARCHIVE_CANDIDATE").length}\n- Media reusable: ${count((row) => row.mediaStatus === "MEDIA_REUSABLE")}\n- Media requiring review: ${count((row) => row.mediaStatus === "MEDIA_PRESENT_NEEDS_REVIEW")}\n- Media missing: ${count((row) => row.mediaStatus === "MEDIA_MISSING")}\n- Family hero required: ${count((row) => row.mediaStatus === "FAMILY_HERO_REQUIRED")}\n- Service visuals required: ${count((row) => row.mediaStatus === "SERVICE_VISUAL_REQUIRED")}\n\n## Category 8 Cleanup\n\n${category8.map((row) => `- ${row.classification}: ${row.name} (variants=${row.variantCount ?? 0}, images=${row.imageCount ?? 0}, requestRefs=${row.requestItemReferences ?? 0}, quotationRefs=${row.quotationItemReferences ?? 0})`).join("\n") || "No existing Category 8 products found."}\n\n## Product Families\n\n${families.map((row) => `- ${row.manifestName}: ${row.mappingStatus}; candidates=${row.existingCandidates.length}`).join("\n")}\n\n## Procurement Services\n\n${services.map((row) => `- ${row.manifestName}: ${row.recommendedAction}`).join("\n")}\n\n## Next Action\n\nReview this dry-run report, approve explicit identity/alias decisions, then design the smallest schema and manifest-driven draft seed.\n`;
}

function summary(report: any): string {
  const rows: CompatibilityRow[] = report.rows;
  const count = (predicate: (row: CompatibilityRow) => boolean) => rows.filter(predicate).length;
  return `MASTER CATALOGUE COMPATIBILITY\n\nManifest entries:            ${rows.length}\nCategories:                  10\n\nExact slug matches:          ${count((row) => row.mappingStatus === "EXACT_SLUG_MATCH" || row.mappingStatus === "FAMILY_ALREADY_MODELED")}\nAlias matches:               ${count((row) => row.mappingStatus === "ALIAS_MATCH")}\nManual review:               ${count((row) => row.mappingStatus === "MANUAL_REVIEW" || row.mappingStatus === "PARTIAL_FAMILY_MATCH")}\nCreate new draft:            ${count((row) => row.mappingStatus === "CREATE_NEW_DRAFT" || row.mappingStatus === "NO_FAMILY_MATCH")}\n\nProduct families:            ${count((row) => row.entryType === "PRODUCT_FAMILY")}\nFamilies needing merge:      ${count((row) => row.mappingStatus === "SEPARATE_PRODUCTS_NEED_CONSOLIDATION")}\n\nExisting media reusable:     ${count((row) => row.mediaStatus === "MEDIA_REUSABLE")}\nMedia requiring review:     ${count((row) => row.mediaStatus === "MEDIA_PRESENT_NEEDS_REVIEW")}\nMedia missing:               ${count((row) => row.mediaStatus === "MEDIA_MISSING")}\nFamily hero required:        ${count((row) => row.mediaStatus === "FAMILY_HERO_REQUIRED")}\n\nHistorical refs detected:    ${count((row) => row.historicalReferenceRisk === "HAS_HISTORICAL_REFERENCES")}\n\nDATABASE MUTATIONS:          0\n`;
}

const direct = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (direct) void runMapper().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
