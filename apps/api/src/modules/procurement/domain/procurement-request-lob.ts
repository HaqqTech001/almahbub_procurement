import type { Prisma, ProcurementRequestLob } from "@hamd/database";

import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";

export const PROCUREMENT_REQUEST_LOBS = [
  "international",
  "integrated_export",
] as const;

export type ProcurementRequestLobValue =
  (typeof PROCUREMENT_REQUEST_LOBS)[number];

export const DEFAULT_PROCUREMENT_REQUEST_LOB =
  "international" as const satisfies ProcurementRequestLobValue;

export const PROCUREMENT_REQUEST_LOB_LIST_FILTERS = [
  "all",
  ...PROCUREMENT_REQUEST_LOBS,
] as const;

export type ProcurementRequestLobListFilter =
  (typeof PROCUREMENT_REQUEST_LOB_LIST_FILTERS)[number];

/** Prisma `where` fragment for LOB list isolation. `all` → no lob predicate. */
export function procurementRequestLobWhere(
  lob: ProcurementRequestLobListFilter | undefined,
): Pick<Prisma.ProcurementRequestWhereInput, "lob"> | Record<string, never> {
  if (!lob || lob === "all") return {};
  return { lob };
}

/**
 * Omitted `lob`:
 * - Ops (`request:manage`) → all LOBs (queue)
 * - Buyer → all LOBs they own (owner-scoped in the repository; not a cross-org queue)
 *
 * Explicit `lob=all` still requires `request:manage`.
 * Explicit `international` / `integrated_export` always isolate.
 */
export function resolveProcurementListLob(
  context: AuthContext,
  requested: ProcurementRequestLobListFilter | undefined,
): ProcurementRequestLobListFilter {
  if (requested === undefined) {
    return "all";
  }
  if (requested !== "all") return requested;
  if (context.permissionKeys.has("request:manage")) return "all";
  throw new AppError({
    statusCode: 403,
    code: "FORBIDDEN",
    message: "Listing all procurement lines of business is not permitted.",
  });
}

export function isProcurementRequestLob(
  value: string,
): value is ProcurementRequestLobValue {
  return (PROCUREMENT_REQUEST_LOBS as readonly string[]).includes(value);
}

export type { ProcurementRequestLob };
