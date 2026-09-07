import type {
  ActivityLogEntry,
  IdentityUser,
  MembershipRecord,
  OrganizationInvitation,
  OrganizationSummary,
  PermissionSummary,
  RoleSummary,
  SessionDevice,
  UserPreferences,
} from "./types.js";

export const identityCurrentUserFixture: IdentityUser = {
  id: "user-ada",
  email: "ada@almahbub.example",
  status: "active",
  firstName: "Ada",
  lastName: "Okonkwo",
  displayName: "Ada Okonkwo",
  locale: "en",
  timeZone: "Africa/Lagos",
  avatarUrl: null,
  emailVerifiedAt: "2026-01-10T10:00:00.000Z",
  lastAuthenticatedAt: "2026-08-04T18:00:00.000Z",
  createdAt: "2025-11-01T09:00:00.000Z",
};

export const identityOrganizationsFixture: OrganizationSummary[] = [
  {
    id: "org-almahbub",
    legalName: "Almahbub International Ltd",
    displayName: "Almahbub International",
    slug: "almahbub",
    status: "active",
    countryCode: "NG",
    roleLabel: "Organization admin",
  },
  {
    id: "org-partner",
    legalName: "Partner Sourcing LLC",
    displayName: "Partner Sourcing",
    slug: "partner-sourcing",
    status: "active",
    countryCode: "AE",
    roleLabel: "Buyer",
  },
];

export const identityRolesFixture: RoleSummary[] = [
  {
    id: "role-admin",
    key: "org_admin",
    name: "Organization admin",
    description: "Manage members, roles, and org settings.",
    scope: "organization",
    permissionKeys: [
      "organization.read",
      "membership.manage",
      "role.assign",
      "user.invite",
      "audit.read",
    ],
  },
  {
    id: "role-buyer",
    key: "buyer",
    name: "Buyer",
    description: "Create and track procurement requests.",
    scope: "organization",
    permissionKeys: ["procurement.request.create", "procurement.request.read"],
  },
  {
    id: "role-finance",
    key: "finance",
    name: "Finance",
    description: "Invoices and payments.",
    scope: "organization",
    permissionKeys: ["invoice.read", "payment.read"],
  },
];

export const identityPermissionsFixture: PermissionSummary[] =
  identityRolesFixture.flatMap((role) =>
    role.permissionKeys.map((key) => {
      const [resource = "unknown", action = "read"] = key.split(".");
      return { key, resource, action };
    }),
  );

const hours = (h: number) =>
  new Date(Date.now() - h * 3_600_000).toISOString();

export const identityMembersFixture: MembershipRecord[] = [
  {
    id: "mem-1",
    organizationId: "org-almahbub",
    userId: "user-ada",
    status: "active",
    joinedAt: "2025-11-01T09:00:00.000Z",
    user: identityCurrentUserFixture,
    roles: [identityRolesFixture[0]!],
  },
  {
    id: "mem-2",
    organizationId: "org-almahbub",
    userId: "user-james",
    status: "active",
    joinedAt: "2025-12-12T09:00:00.000Z",
    user: {
      id: "user-james",
      email: "james@almahbub.example",
      status: "active",
      firstName: "James",
      lastName: "Nwosu",
      locale: "en",
      timeZone: "Africa/Lagos",
      createdAt: "2025-12-12T09:00:00.000Z",
    },
    roles: [identityRolesFixture[1]!],
  },
  {
    id: "mem-3",
    organizationId: "org-almahbub",
    userId: "user-maya",
    status: "invited",
    joinedAt: null,
    user: {
      id: "user-maya",
      email: "maya@partner.example",
      status: "pending_verification",
      firstName: "Maya",
      lastName: "Chen",
      locale: "en",
      createdAt: "2026-07-20T09:00:00.000Z",
    },
    roles: [identityRolesFixture[1]!],
  },
  {
    id: "mem-4",
    organizationId: "org-almahbub",
    userId: "user-leo",
    status: "suspended",
    joinedAt: "2026-02-01T09:00:00.000Z",
    user: {
      id: "user-leo",
      email: "leo@almahbub.example",
      status: "suspended",
      firstName: "Leo",
      lastName: "Mensah",
      locale: "en",
      createdAt: "2026-02-01T09:00:00.000Z",
    },
    roles: [identityRolesFixture[2]!],
  },
  {
    id: "mem-5",
    organizationId: "org-almahbub",
    userId: "user-sara",
    status: "active",
    joinedAt: "2026-03-15T09:00:00.000Z",
    user: {
      id: "user-sara",
      email: "sara@almahbub.example",
      status: "active",
      firstName: "Sara",
      lastName: "Ibrahim",
      locale: "fr",
      timeZone: "Africa/Lagos",
      createdAt: "2026-03-15T09:00:00.000Z",
    },
    roles: [identityRolesFixture[2]!],
  },
];

export const identityInvitationsFixture: OrganizationInvitation[] = [
  {
    id: "inv-1",
    organizationId: "org-almahbub",
    email: "new.buyer@client.example",
    status: "invited",
    expiresAt: new Date(Date.now() + 72 * 3_600_000).toISOString(),
    createdAt: hours(24),
    roleKeys: ["buyer"],
    createdByName: "Ada Okonkwo",
  },
];

export const identitySessionsFixture: SessionDevice[] = [
  {
    id: "sess-1",
    status: "active",
    deviceName: "Ada's MacBook",
    platform: "macOS",
    userAgent: "Chrome 126",
    ipLabel: "Lagos · NG",
    lastUsedAt: hours(0.2),
    createdAt: hours(48),
    current: true,
    deviceId: "dev-1",
  },
  {
    id: "sess-2",
    status: "active",
    deviceName: "Pixel 8",
    platform: "Android",
    userAgent: "Mobile Safari",
    ipLabel: "Abuja · NG",
    lastUsedAt: hours(30),
    createdAt: hours(200),
    deviceId: "dev-2",
  },
  {
    id: "sess-3",
    status: "revoked",
    deviceName: "Old laptop",
    platform: "Windows",
    lastUsedAt: hours(800),
    createdAt: hours(900),
  },
];

export const identityActivityFixture: ActivityLogEntry[] = [
  {
    id: "act-1",
    action: "membership.invited",
    resourceType: "organization_invitation",
    resourceId: "inv-1",
    actorName: "Ada Okonkwo",
    createdAt: hours(24),
  },
  {
    id: "act-2",
    action: "user.suspended",
    resourceType: "user",
    resourceId: "user-leo",
    actorName: "Ada Okonkwo",
    createdAt: hours(120),
    metadata: { reason: "Policy review" },
  },
  {
    id: "act-3",
    action: "role.assigned",
    resourceType: "membership",
    resourceId: "mem-5",
    actorName: "Ada Okonkwo",
    createdAt: hours(200),
  },
  {
    id: "act-4",
    action: "session.revoked",
    resourceType: "user_session",
    resourceId: "sess-3",
    actorName: "Ada Okonkwo",
    createdAt: hours(400),
  },
];

export const identityPreferencesFixture: UserPreferences = {
  locale: "en",
  timeZone: "Africa/Lagos",
  theme: "system",
  notifications: [
    { type: "procurement", channel: "email", enabled: true },
    { type: "procurement", channel: "in_app", enabled: true },
    { type: "payment", channel: "email", enabled: true },
    { type: "announcement", channel: "in_app", enabled: false },
  ],
};
