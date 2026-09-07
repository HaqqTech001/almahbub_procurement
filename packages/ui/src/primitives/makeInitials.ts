const SKIP = new Set([
  "the",
  "and",
  "of",
  "for",
  "company",
  "ltd",
  "limited",
  "inc",
  "plc",
  "co",
]);

/** Deterministic initials, usually two letters, from a display name. */
export function makeInitials(name: string, maxChars = 2): string {
  const cleaned = name.replace(/[^\p{L}\p{N}\s-]+/gu, " ").trim();
  const parts = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !SKIP.has(part.toLowerCase()));
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase().slice(0, maxChars);
  }
  const token = (parts[0] ?? (cleaned || "?")).replace(/-/g, "");
  const letters = token.replace(/[^\p{L}\p{N}]/gu, "");
  return (letters.slice(0, maxChars) || "?").toUpperCase();
}
