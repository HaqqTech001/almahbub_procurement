import { compareProductPriority } from "@hamd/constants";
import type { DatabaseClient } from "../../../shared/database/database-client.js";

type ProductWhere = NonNullable<NonNullable<Parameters<DatabaseClient["product"]["findMany"]>[0]>["where"]>;

/** No migration or writes. Fetch lightweight ranking metadata, then hydrate only one page. */
export async function prioritizedProductSlugs(database: DatabaseClient, where: ProductWhere, page: number, pageSize: number) {
  const candidates = await database.product.findMany({
    where,
    select: { slug: true, name: true, category: { select: { slug: true } }, images: { select: { url: true, position: true }, orderBy: { position: "asc" }, take: 1 } },
  });
  return candidates.sort(compareProductPriority).slice((page - 1) * pageSize, page * pageSize).map(row => row.slug);
}

export function restoreProductOrder<T extends { slug: string }>(rows: T[], slugs: string[]): T[] {
  const order = new Map(slugs.map((slug, index) => [slug, index]));
  return rows.filter(row => order.has(row.slug)).sort((a, b) => order.get(a.slug)! - order.get(b.slug)!);
}
