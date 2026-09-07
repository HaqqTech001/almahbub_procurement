/**
 * Integrated Export market domain contract (IE-6) - UI/content only.
 *
 * No database or API. Absence of published records means market destinations
 * are not listed on this portal - never invent countries or coverage claims.
 */

export type IeMarket = {
  id: string;
  name: string;
  /** Optional region label when owner-approved - not a continent coverage claim. */
  region?: string;
  description?: string;
  /** Public gate. Unpublished records must never appear publicly. */
  published: boolean;
  sortOrder?: number;
};
