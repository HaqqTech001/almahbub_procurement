type ContentEntry = {
  name: string;
  entryType:
    | "STANDARD_PRODUCT"
    | "PRODUCT_FAMILY"
    | "PROCUREMENT_SERVICE"
    | "CONFIGURABLE_PRODUCT";
  summary: string;
  keySpecs?: Record<string, unknown>;
  variants?: Array<Record<string, unknown> & { name: string }>;
  availabilityStatus?: "ON_REQUEST" | "COMING_SOON" | "PRE_ORDER" | "OUT_OF_STOCK";
};

function humanizeKey(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function printable(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length ? items.join(", ") : null;
  }
  if (typeof value === "object") return null;
  const result = String(value).trim();
  return result || null;
}

export function buildVerifiedManifestDescription(entry: ContentEntry): string {
  const paragraphs: string[] = [];
  const summary = entry.summary.trim();
  if (summary) paragraphs.push(summary);

  if (entry.entryType === "PRODUCT_FAMILY") {
    const names = (entry.variants ?? [])
      .map((variant) => variant.name.trim())
      .filter(Boolean);
    if (names.length) {
      paragraphs.push(
        `Catalogue variants: ${names.join(", ")}. Variant availability is confirmed during quotation.`,
      );
    }
  } else if (entry.entryType === "PROCUREMENT_SERVICE") {
    paragraphs.push(
      "This is a procurement service rather than warehouse inventory. Scope, supplier options, quantity, destination and commercial terms are confirmed during the sourcing process.",
    );
  } else if (entry.entryType === "CONFIGURABLE_PRODUCT") {
    paragraphs.push(
      "Configuration is confirmed against the buyer's requested dimensions, options and project requirements before quotation.",
    );
  }

  const specs = Object.entries(entry.keySpecs ?? {}).flatMap(([key, value]) => {
    const rendered = printable(value);
    return rendered ? [`${humanizeKey(key)}: ${rendered}`] : [];
  });
  if (specs.length) paragraphs.push(`Key specifications: ${specs.join("; ")}.`);

  if (entry.availabilityStatus === "COMING_SOON") {
    paragraphs.push("Catalogue status: coming soon.");
  } else if (entry.availabilityStatus === "PRE_ORDER") {
    paragraphs.push("Catalogue status: pre-order.");
  } else if (entry.availabilityStatus === "OUT_OF_STOCK") {
    paragraphs.push("Catalogue status: currently out of stock; sourcing availability must be reconfirmed.");
  } else {
    paragraphs.push("Available on request through Almahbub International procurement.");
  }

  return paragraphs.join("\n\n");
}
