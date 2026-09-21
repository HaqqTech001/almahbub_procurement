/**
 * Conservative product → core-type matching for licensed primary images.
 * Shared last-word / last-two-word classes become one visual type.
 * Abstract lots/briefs stay needs_review.
 */

export type ProductPrimaryMatchKind = "core_type" | "needs_review";

export type ProductPrimaryMatch = {
  kind: ProductPrimaryMatchKind;
  coreType: string;
  reason: string;
};

const ABSTRACT_MARKERS = [
  "sourcing brief",
  "procurement bundle",
  "sourcing lot",
  "consumables bundle",
  "consumables lot",
];

function wordsOf(name: string): string[] {
  return name
    .replace(/[–—]/g, " ")
    .split(/[\s/]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

function lastOne(name: string): string {
  const words = wordsOf(name);
  return (words[words.length - 1] ?? "").toLowerCase();
}

function lastTwo(name: string): string {
  const words = wordsOf(name);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0]!.toLowerCase();
  return words.slice(-2).join(" ").toLowerCase();
}

export function isAbstractCoreType(coreType: string): boolean {
  const normalized = coreType.toLowerCase();
  return ABSTRACT_MARKERS.some((marker) => normalized.includes(marker));
}

export function buildProductCoreTypeIndex(names: readonly string[]): Map<string, string> {
  const oneCounts = new Map<string, number>();
  const twoCounts = new Map<string, number>();
  for (const name of names) {
    const one = lastOne(name);
    const two = lastTwo(name);
    if (one) oneCounts.set(one, (oneCounts.get(one) ?? 0) + 1);
    if (two) twoCounts.set(two, (twoCounts.get(two) ?? 0) + 1);
  }

  const index = new Map<string, string>();
  for (const name of names) {
    const one = lastOne(name);
    const two = lastTwo(name);
    let core = two;
    if ((twoCounts.get(two) ?? 0) >= 2) {
      core = two;
    } else if ((oneCounts.get(one) ?? 0) >= 2) {
      core = one;
    }
    index.set(name, core);
  }
  return index;
}

export function classifyProductPrimaryMatch(
  name: string,
  coreTypeIndex?: Map<string, string>,
): ProductPrimaryMatch {
  const coreType = coreTypeIndex?.get(name) ?? lastTwo(name);
  if (!coreType) {
    return {
      kind: "needs_review",
      coreType: "",
      reason: "Product name could not be reduced to a visual core type.",
    };
  }
  if (isAbstractCoreType(coreType)) {
    return {
      kind: "needs_review",
      coreType,
      reason: "Abstract sourcing/bundle type: no confident physical photograph.",
    };
  }
  return {
    kind: "core_type",
    coreType,
    reason: "Core type is a physical catalogue object class.",
  };
}

export function productCoreType(name: string, coreTypeIndex?: Map<string, string>): string {
  return coreTypeIndex?.get(name) ?? lastTwo(name);
}
