/** Identity & organization contracts aligned with Prisma + docs/13–14. */

export const USER_STATUSES = [
  "pending_verification",
  "active",
  "suspended",
  "deactivated",
] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const MEMBERSHIP_STATUSES = [
  "invited",
  "active",
  "suspended",
  "removed",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const ORGANIZATION_STATUSES = [
  "pending",
  "active",
  "suspended",
  "archived",
] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export type ThemePreference = "system" | "light" | "dark";

export type IdentityUser = {
  id: string;
  email: string;
  status: UserStatus | string;
  firstName: string;
  lastName: string;
  displayName?: string | null | undefined;
  locale: string;
  timeZone?: string | null | undefined;
  avatarUrl?: string | null | undefined;
  emailVerifiedAt?: string | null | undefined;
  lastAuthenticatedAt?: string | null | undefined;
  createdAt: string;
};

export type OrganizationSummary = {
  id: string;
  legalName: string;
  displayName: string;
  slug: string;
  status: OrganizationStatus | string;
  countryCode?: string | null | undefined;
  roleLabel?: string | undefined;
};

export type RoleSummary = {
  id: string;
  key: string;
  name: string;
  description?: string | null | undefined;
  scope: "platform" | "organization" | string;
  permissionKeys: string[];
};

export type PermissionSummary = {
  key: string;
  resource: string;
  action: string;
  description?: string | null | undefined;
};

export type MembershipRecord = {
  id: string;
  organizationId: string;
  userId: string;
  status: MembershipStatus | string;
  joinedAt?: string | null | undefined;
  user: IdentityUser;
  roles: RoleSummary[];
};

export type OrganizationInvitation = {
  id: string;
  organizationId: string;
  email: string;
  status: MembershipStatus | string;
  expiresAt: string;
  createdAt: string;
  roleKeys?: string[] | undefined;
  createdByName?: string | null | undefined;
};

export type SessionDevice = {
  id: string;
  status: "active" | "revoked" | "expired" | string;
  deviceName?: string | null | undefined;
  platform?: string | null | undefined;
  userAgent?: string | null | undefined;
  ipLabel?: string | null | undefined;
  lastUsedAt: string;
  createdAt: string;
  current?: boolean | undefined;
  deviceId?: string | null | undefined;
};

export type ActivityLogEntry = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  actorName?: string | null | undefined;
  createdAt: string;
  metadata?: Record<string, unknown> | undefined;
};

export type NotificationPrefRow = {
  type: string;
  channel: string;
  enabled: boolean;
  locale?: string | undefined;
};

export type UserPreferences = {
  locale: string;
  timeZone: string;
  theme: ThemePreference;
  notifications: NotificationPrefRow[];
};

export type IdentityDirectoryFilters = {
  query: string;
  status: "all" | MembershipStatus | string;
  roleKey: string;
  page: number;
  pageSize: number;
};

export type BulkMemberAction =
  | "suspend"
  | "restore"
  | "remove"
  | "assign_role"
  | "export";

export const emptyDirectoryFilters = (): IdentityDirectoryFilters => ({
  query: "",
  status: "all",
  roleKey: "",
  page: 1,
  pageSize: 10,
});

export function userDisplayName(user: Pick<IdentityUser, "firstName" | "lastName" | "displayName" | "email">): string {
  if (user.displayName?.trim()) return user.displayName.trim();
  const full = `${user.firstName} ${user.lastName}`.trim();
  return full || user.email;
}

export function userInitials(user: Pick<IdentityUser, "firstName" | "lastName" | "displayName" | "email">): string {
  const name = userDisplayName(user);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export function filterMemberships(
  rows: MembershipRecord[],
  filters: IdentityDirectoryFilters,
): MembershipRecord[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (
      filters.roleKey &&
      !row.roles.some((r) => r.key === filters.roleKey)
    ) {
      return false;
    }
    if (!q) return true;
    const hay = [
      row.user.email,
      row.user.firstName,
      row.user.lastName,
      row.user.displayName ?? "",
      ...row.roles.map((r) => r.name),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paginateRows<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; page: number; pageCount: number } {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageCount,
  };
}

export function membershipsToCsv(rows: MembershipRecord[]): string {
  const header = [
    "membership_id",
    "email",
    "first_name",
    "last_name",
    "status",
    "roles",
    "joined_at",
  ];
  const lines = rows.map((r) =>
    [
      r.id,
      r.user.email,
      r.user.firstName,
      r.user.lastName,
      r.status,
      r.roles.map((role) => role.key).join("|"),
      r.joinedAt ?? "",
    ]
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

export const LOCALES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
  { code: "pt", label: "Português" },
] as const;

export const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
