/** Typography only: preserve stored claims while joining contrast clauses naturally. */
export function catalogueCopy(value: string): string {
  return value.replace(/\s*\u2014\s*(?=not\b)/gi, ", ").replace(/\s*\u2014\s*/g, "; ");
}
