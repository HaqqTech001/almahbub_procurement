/** Supplier management contracts - Prisma SupplierStatus + docs/12 extensions. */

export const SUPPLIER_STATUSES = [
  "draft",
  "active",
  "suspended",
  "archived",
] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  "unverified",
  "pending",
  "verified",
  "rejected",
  "expired",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const RISK_TIERS = ["low", "medium", "high", "critical"] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export type SupplierContact = {
  id: string;
  name: string;
  email?: string | null | undefined;
  phone?: string | null | undefined;
  role?: string | null | undefined;
  isPrimary: boolean;
};

export type SupplierLocation = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  countryCode: string;
  isHeadquarters?: boolean | undefined;
};

export type SupplierCertification = {
  id: string;
  type: string;
  issuer: string;
  number: string;
  issuedAt: string;
  expiresAt?: string | null | undefined;
  status: "valid" | "expiring" | "expired" | "revoked" | string;
  documentHref?: string | null | undefined;
};

export type SupplierDocument = {
  id: string;
  name: string;
  kind: string;
  uploadedAt: string;
  href: string;
  sizeLabel?: string | undefined;
};

export type SupplierRating = {
  overall: number;
  quality: number;
  delivery: number;
  communication: number;
  reviewCount: number;
};

export type SupplierLeadTime = {
  minDays: number;
  maxDays: number;
  typicalDays: number;
  notes?: string | undefined;
};

export type SupplierPerformanceMetric = {
  key: string;
  label: string;
  value: string;
  trend?: "up" | "down" | "flat" | undefined;
  period: string;
};

export type SupplierProductLink = {
  id: string;
  name: string;
  sku?: string | undefined;
  category?: string | undefined;
  href?: string | undefined;
  moq?: string | undefined;
};

export type SupplierCommunication = {
  id: string;
  subject: string;
  preview: string;
  updatedAt: string;
  href: string;
  unread?: boolean | undefined;
};

export type SupplierRecord = {
  id: string;
  legalName: string;
  tradeName?: string | null | undefined;
  status: SupplierStatus | string;
  countryCode?: string | null | undefined;
  countriesServed: string[];
  verification: VerificationStatus | string;
  riskTier: RiskTier | string;
  riskScore: number;
  website?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
  contacts: SupplierContact[];
  locations: SupplierLocation[];
  certifications: SupplierCertification[];
  documents: SupplierDocument[];
  ratings: SupplierRating;
  leadTime: SupplierLeadTime;
  performance: SupplierPerformanceMetric[];
  products: SupplierProductLink[];
  communications: SupplierCommunication[];
  categories?: string[] | undefined;
  notes?: string | null | undefined;
};

export type SupplierDirectoryFilters = {
  query: string;
  status: "all" | SupplierStatus | string;
  country: string;
  riskTier: "all" | RiskTier | string;
  verification: "all" | VerificationStatus | string;
  page: number;
  pageSize: number;
};

export type SupplierAdminAction =
  | "approve"
  | "suspend"
  | "restore"
  | "archive"
  | "verify"
  | "reject_verification"
  | "reassess_risk";

export const emptySupplierFilters = (): SupplierDirectoryFilters => ({
  query: "",
  status: "all",
  country: "",
  riskTier: "all",
  verification: "all",
  page: 1,
  pageSize: 8,
});

export function supplierStatusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export function riskLabel(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function filterSuppliers(
  rows: SupplierRecord[],
  filters: SupplierDirectoryFilters,
): SupplierRecord[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.country && row.countryCode !== filters.country) {
      if (!row.countriesServed.includes(filters.country)) return false;
    }
    if (filters.riskTier !== "all" && row.riskTier !== filters.riskTier) {
      return false;
    }
    if (
      filters.verification !== "all" &&
      row.verification !== filters.verification
    ) {
      return false;
    }
    if (!q) return true;
    const hay = [
      row.legalName,
      row.tradeName ?? "",
      row.countryCode ?? "",
      ...row.countriesServed,
      ...row.categories ?? [],
      ...row.contacts.map((c) => `${c.name} ${c.email ?? ""}`),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paginateSupplierRows<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; page: number; pageCount: number } {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageCount,
  };
}

export function suppliersToCsv(rows: SupplierRecord[]): string {
  const header = [
    "id",
    "legal_name",
    "status",
    "country",
    "verification",
    "risk_tier",
    "risk_score",
    "lead_time_typical_days",
    "rating_overall",
  ];
  const lines = rows.map((r) =>
    [
      r.id,
      r.legalName,
      r.status,
      r.countryCode ?? "",
      r.verification,
      r.riskTier,
      r.riskScore,
      r.leadTime.typicalDays,
      r.ratings.overall,
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export function averagePerformanceScore(
  metrics: SupplierPerformanceMetric[],
): number | null {
  const numeric = metrics
    .map((m) => Number.parseFloat(m.value))
    .filter((n) => Number.isFinite(n));
  if (!numeric.length) return null;
  return Math.round(
    (numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10,
  ) / 10;
}
