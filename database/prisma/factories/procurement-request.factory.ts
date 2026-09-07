import { faker } from "@faker-js/faker";

export function buildProcurementRequest(
  organizationId: string,
  overrides: Partial<{
    publicCode: string;
    title: string;
    currencyCode: string;
    notes: string;
  }> = {},
) {
  return {
    id: faker.string.uuid({ version: "7" }),
    organizationId,
    publicCode: overrides.publicCode ?? `PR-${faker.string.numeric(8)}`,
    title: overrides.title ?? faker.commerce.productName(),
    currencyCode: overrides.currencyCode ?? "USD",
    notes: overrides.notes ?? null,
    status: "draft" as const,
    rowVersion: 0,
  };
}
