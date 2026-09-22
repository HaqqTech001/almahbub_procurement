const COMMON_IDENTITY_WORDS = new Set([
  "and", "for", "the", "with", "series", "system", "systems", "professional",
  "premium", "smart", "control", "home", "edition", "integrated", "solution",
  "solutions", "plus", "pro", "max", "mini", "new",
]);

function tokens(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function distinctive(values: string[]): string[] {
  return values.filter((token) => !COMMON_IDENTITY_WORDS.has(token));
}

export type MasterCatalogueIdentityEvidence = {
  safe: boolean;
  productTokens: string[];
  manufacturerTokens: string[];
  matchedProductTokens: string[];
  matchedManufacturerTokens: string[];
  matchedDistinctiveTokens: string[];
  matchRatio: number;
  reason: string;
};

export function masterCatalogueIdentityEvidence(input: {
  productName: string;
  manufacturer?: string | null;
  candidateTitle: string;
}): MasterCatalogueIdentityEvidence {
  const productTokens = tokens(input.productName);
  const candidate = new Set(tokens(input.candidateTitle));
  const manufacturerTokens = distinctive(tokens(input.manufacturer ?? ""));
  const matchedProductTokens = productTokens.filter((token) => candidate.has(token));
  const matchedManufacturerTokens = manufacturerTokens.filter((token) => candidate.has(token));

  const manufacturerSet = new Set(manufacturerTokens);
  const productIdentityTokens = distinctive(
    productTokens.filter((token) => !manufacturerSet.has(token)),
  );
  const matchedDistinctiveTokens = productIdentityTokens.filter((token) => candidate.has(token));
  const matchRatio = productTokens.length
    ? matchedProductTokens.length / productTokens.length
    : 0;

  const manufacturerOk =
    manufacturerTokens.length === 0 || matchedManufacturerTokens.length > 0;
  const modelTokenMatched = matchedDistinctiveTokens.some(
    (token) => /\d/.test(token) || token.length >= 4,
  );

  const enoughIdentity =
    manufacturerTokens.length > 0
      ? matchedProductTokens.length >= 2 && matchedDistinctiveTokens.length >= 1 && modelTokenMatched
      : matchedProductTokens.length >= 2 && matchRatio >= 0.6 && modelTokenMatched;

  const safe = manufacturerOk && enoughIdentity;
  const reason = safe
    ? "Candidate carries manufacturer and model/product identity evidence."
    : !manufacturerOk
      ? "Candidate does not match the manifest manufacturer identity."
      : "Candidate does not carry enough distinctive model/product identity evidence.";

  return {
    safe,
    productTokens,
    manufacturerTokens,
    matchedProductTokens,
    matchedManufacturerTokens,
    matchedDistinctiveTokens,
    matchRatio: Math.round(matchRatio * 100) / 100,
    reason,
  };
}
