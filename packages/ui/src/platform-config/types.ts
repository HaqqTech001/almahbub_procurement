/** Centralized platform configuration - docs/19 settings; hosts inject API. */

export const PLATFORM_CONFIG_SECTIONS = [
  "general",
  "branding",
  "email",
  "notifications",
  "authentication",
  "security",
  "storage",
  "ai",
  "integrations",
  "payments",
  "seo",
  "maintenance",
  "wedding_campaign",
] as const;
export type PlatformConfigSection = (typeof PLATFORM_CONFIG_SECTIONS)[number];

export type PlatformConfigFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "secret"
  | "url"
  | "email";

export type PlatformConfigFieldDef = {
  key: string;
  label: string;
  type: PlatformConfigFieldType;
  description?: string | undefined;
  required?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  options?: { value: string; label: string }[] | undefined;
  secret?: boolean | undefined;
};

export type PlatformConfigValues = Record<string, string | number | boolean>;

export type PlatformConfigDocument = {
  id: string;
  version: number;
  rowVersion: number;
  updatedAt: string;
  updatedBy?: string | undefined;
  values: PlatformConfigValues;
};

export type PlatformConfigVersion = {
  id: string;
  version: number;
  summary: string;
  createdAt: string;
  authorName?: string | undefined;
  values: PlatformConfigValues;
  current?: boolean | undefined;
};

export type PlatformConfigChangeLogEntry = {
  id: string;
  section: PlatformConfigSection | string;
  summary: string;
  actorName: string;
  occurredAt: string;
  version: number;
};

export type PlatformConfigValidationIssue = {
  field: string;
  section: PlatformConfigSection | string;
  message: string;
};

export type PlatformConfigSaveInput = {
  values: PlatformConfigValues;
  rowVersion: number;
  summary?: string | undefined;
};

export type PlatformConfigRollbackInput = {
  versionId: string;
  rowVersion: number;
  reason?: string | undefined;
};

export function platformConfigSectionLabel(section: string): string {
  const labels: Record<string, string> = {
    general: "General",
    branding: "Branding",
    email: "Email",
    notifications: "Notifications",
    authentication: "Authentication",
    security: "Security",
    storage: "Storage",
    ai: "AI",
    integrations: "Integrations",
    payments: "Payments",
    seo: "SEO",
    maintenance: "Maintenance mode",
    wedding_campaign: "Wedding campaign",
  };
  return labels[section] ?? section.replaceAll("_", " ");
}

/** Field registry for mission settings sections. */
export const PLATFORM_CONFIG_FIELDS: Record<
  PlatformConfigSection,
  PlatformConfigFieldDef[]
> = {
  general: [
    {
      key: "siteName",
      label: "Site name",
      type: "text",
      required: true,
    },
    {
      key: "siteDescription",
      label: "Site description",
      type: "textarea",
    },
    {
      key: "timezone",
      label: "Timezone",
      type: "select",
      options: [
        { value: "Africa/Lagos", label: "Africa/Lagos" },
        { value: "UTC", label: "UTC" },
        { value: "Europe/London", label: "Europe/London" },
      ],
      required: true,
    },
    {
      key: "defaultLocale",
      label: "Default locale",
      type: "text",
      required: true,
    },
    {
      key: "defaultCurrency",
      label: "Default currency",
      type: "text",
      required: true,
    },
    {
      key: "supportEmail",
      label: "Support email",
      type: "email",
      required: true,
    },
  ],
  branding: [
    {
      key: "brandPrimaryColor",
      label: "Primary color",
      type: "text",
      description: "Hex color used in approved shells.",
    },
    {
      key: "logoUrl",
      label: "Logo URL",
      type: "url",
    },
    {
      key: "faviconUrl",
      label: "Favicon URL",
      type: "url",
    },
    {
      key: "brandTagline",
      label: "Tagline",
      type: "text",
    },
  ],
  email: [
    {
      key: "smtpHost",
      label: "SMTP host",
      type: "text",
      required: true,
    },
    {
      key: "smtpPort",
      label: "SMTP port",
      type: "number",
      min: 1,
      max: 65535,
      required: true,
    },
    {
      key: "smtpUsername",
      label: "SMTP username",
      type: "text",
    },
    {
      key: "smtpPassword",
      label: "SMTP password",
      type: "secret",
      secret: true,
    },
    {
      key: "emailFromAddress",
      label: "From address",
      type: "email",
      required: true,
    },
    {
      key: "emailFromName",
      label: "From name",
      type: "text",
      required: true,
    },
  ],
  notifications: [
    {
      key: "notifyEmailEnabled",
      label: "Email notifications",
      type: "boolean",
    },
    {
      key: "notifyInAppEnabled",
      label: "In-app notifications",
      type: "boolean",
    },
    {
      key: "notifySmsEnabled",
      label: "SMS notifications (placeholder)",
      type: "boolean",
    },
    {
      key: "notifyPushEnabled",
      label: "Push notifications (future)",
      type: "boolean",
    },
    {
      key: "notifyDigestHourUtc",
      label: "Digest hour (UTC)",
      type: "number",
      min: 0,
      max: 23,
    },
  ],
  authentication: [
    {
      key: "authMfaRequired",
      label: "Require MFA for privileged roles",
      type: "boolean",
    },
    {
      key: "authPasswordMinLength",
      label: "Password minimum length",
      type: "number",
      min: 8,
      max: 128,
      required: true,
    },
    {
      key: "authSessionTimeoutMinutes",
      label: "Session timeout (minutes)",
      type: "number",
      min: 5,
      max: 1440,
      required: true,
    },
    {
      key: "authMaxLoginAttempts",
      label: "Max login attempts",
      type: "number",
      min: 3,
      max: 20,
      required: true,
    },
    {
      key: "authInviteExpiryHours",
      label: "Invite expiry (hours)",
      type: "number",
      min: 1,
      max: 720,
    },
  ],
  security: [
    {
      key: "securityStepUpPayments",
      label: "Step-up auth for payments",
      type: "boolean",
    },
    {
      key: "securityIpAllowlist",
      label: "Admin IP allowlist",
      type: "textarea",
      description: "Comma-separated CIDRs; empty = unrestricted.",
    },
    {
      key: "securityAuditExportRoles",
      label: "Audit export roles",
      type: "text",
    },
    {
      key: "securityBreakGlassEnabled",
      label: "Break-glass admin path",
      type: "boolean",
    },
  ],
  storage: [
    {
      key: "storageProvider",
      label: "Storage provider",
      type: "select",
      options: [
        { value: "s3", label: "S3-compatible" },
        { value: "azure", label: "Azure Blob" },
        { value: "gcs", label: "GCS" },
      ],
      required: true,
    },
    {
      key: "storageBucket",
      label: "Bucket / container",
      type: "text",
      required: true,
    },
    {
      key: "storageRegion",
      label: "Region",
      type: "text",
    },
    {
      key: "storageMaxUploadMb",
      label: "Max upload (MB)",
      type: "number",
      min: 1,
      max: 1024,
    },
    {
      key: "storageVirusScanEnabled",
      label: "Virus scan uploads",
      type: "boolean",
    },
  ],
  ai: [
    {
      key: "aiAssistantEnabled",
      label: "AI procurement assistant",
      type: "boolean",
    },
    {
      key: "aiProvider",
      label: "LLM provider",
      type: "select",
      options: [
        { value: "none", label: "Disabled / stub" },
        { value: "openai", label: "OpenAI-compatible" },
        { value: "azure_openai", label: "Azure OpenAI" },
      ],
    },
    {
      key: "aiApiKey",
      label: "API key",
      type: "secret",
      secret: true,
    },
    {
      key: "aiDailyQuotaPerUser",
      label: "Daily quota per user",
      type: "number",
      min: 0,
      max: 10000,
    },
    {
      key: "aiRequireHumanReview",
      label: "Require human review before commit",
      type: "boolean",
    },
  ],
  integrations: [
    {
      key: "integrationWebhooksEnabled",
      label: "Outbound webhooks",
      type: "boolean",
    },
    {
      key: "integrationCarrierTracking",
      label: "Carrier tracking connector",
      type: "select",
      options: [
        { value: "off", label: "Off" },
        { value: "sandbox", label: "Sandbox" },
        { value: "live", label: "Live" },
      ],
    },
    {
      key: "integrationErpSync",
      label: "ERP sync mode",
      type: "select",
      options: [
        { value: "off", label: "Off" },
        { value: "manual", label: "Manual" },
        { value: "scheduled", label: "Scheduled" },
      ],
    },
    {
      key: "integrationWebhookSigningSecret",
      label: "Webhook signing secret",
      type: "secret",
      secret: true,
    },
  ],
  payments: [
    {
      key: "paymentsProvider",
      label: "Payments provider",
      type: "select",
      options: [
        { value: "manual", label: "Manual confirmation" },
        { value: "stripe", label: "Stripe" },
        { value: "paystack", label: "Paystack" },
      ],
      required: true,
    },
    {
      key: "paymentsPublicKey",
      label: "Public key",
      type: "text",
    },
    {
      key: "paymentsSecretKey",
      label: "Secret key",
      type: "secret",
      secret: true,
    },
    {
      key: "paymentsCurrency",
      label: "Settlement currency",
      type: "text",
      required: true,
    },
    {
      key: "paymentsDualControl",
      label: "Dual control for confirmations",
      type: "boolean",
    },
  ],
  seo: [
    {
      key: "seoDefaultTitle",
      label: "Default title",
      type: "text",
      required: true,
    },
    {
      key: "seoDefaultDescription",
      label: "Default description",
      type: "textarea",
      required: true,
    },
    {
      key: "seoCanonicalBase",
      label: "Canonical base URL",
      type: "url",
      required: true,
    },
    {
      key: "seoRobotsDefault",
      label: "Default robots",
      type: "text",
    },
    {
      key: "seoSitemapEnabled",
      label: "Sitemap generation",
      type: "boolean",
    },
  ],
  maintenance: [
    {
      key: "maintenanceEnabled",
      label: "Maintenance mode",
      type: "boolean",
      description: "Blocks non-admin public/app traffic when enabled.",
    },
    {
      key: "maintenanceMessage",
      label: "Public message",
      type: "textarea",
    },
    {
      key: "maintenanceAllowAdmin",
      label: "Allow platform admins",
      type: "boolean",
    },
    {
      key: "maintenanceEta",
      label: "Expected return (ISO)",
      type: "text",
    },
  ],
  wedding_campaign: [
    {
      key: "weddingCampaignEnabled",
      label: "Wedding / celebration campaign",
      type: "boolean",
    },
    {
      key: "weddingCampaignName",
      label: "Campaign name",
      type: "text",
    },
    {
      key: "weddingCampaignAudience",
      label: "Audience",
      type: "select",
      options: [
        { value: "all_authenticated", label: "All authenticated" },
        { value: "customers", label: "Customers" },
        { value: "internal", label: "Internal only" },
      ],
    },
    {
      key: "weddingCampaignStartsAt",
      label: "Starts at (ISO)",
      type: "text",
    },
    {
      key: "weddingCampaignEndsAt",
      label: "Ends at (ISO)",
      type: "text",
    },
    {
      key: "weddingCampaignCtaHref",
      label: "CTA href",
      type: "url",
    },
  ],
};

export function fieldsForSection(
  section: PlatformConfigSection,
): PlatformConfigFieldDef[] {
  return PLATFORM_CONFIG_FIELDS[section];
}

export function sectionForField(fieldKey: string): PlatformConfigSection | null {
  for (const section of PLATFORM_CONFIG_SECTIONS) {
    if (PLATFORM_CONFIG_FIELDS[section].some((f) => f.key === fieldKey)) {
      return section;
    }
  }
  return null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

export function validatePlatformConfig(
  values: PlatformConfigValues,
  sections: readonly PlatformConfigSection[] = PLATFORM_CONFIG_SECTIONS,
): PlatformConfigValidationIssue[] {
  const issues: PlatformConfigValidationIssue[] = [];

  for (const section of sections) {
    for (const field of PLATFORM_CONFIG_FIELDS[section]) {
      const raw = values[field.key];
      const empty =
        raw === undefined ||
        raw === null ||
        (typeof raw === "string" && raw.trim() === "");

      if (field.required && empty) {
        issues.push({
          field: field.key,
          section,
          message: `${field.label} is required.`,
        });
        continue;
      }
      if (empty) continue;

      if (field.type === "number" || typeof raw === "number") {
        const n = typeof raw === "number" ? raw : Number(raw);
        if (Number.isNaN(n)) {
          issues.push({
            field: field.key,
            section,
            message: `${field.label} must be a number.`,
          });
        } else {
          if (field.min !== undefined && n < field.min) {
            issues.push({
              field: field.key,
              section,
              message: `${field.label} must be ≥ ${field.min}.`,
            });
          }
          if (field.max !== undefined && n > field.max) {
            issues.push({
              field: field.key,
              section,
              message: `${field.label} must be ≤ ${field.max}.`,
            });
          }
        }
      }

      if (
        field.type === "email" &&
        typeof raw === "string" &&
        !EMAIL_RE.test(raw.trim())
      ) {
        issues.push({
          field: field.key,
          section,
          message: `${field.label} must be a valid email.`,
        });
      }

      if (field.type === "url" && typeof raw === "string" && !URL_RE.test(raw)) {
        issues.push({
          field: field.key,
          section,
          message: `${field.label} must be an http(s) URL.`,
        });
      }

      if (field.type === "select" && field.options?.length) {
        const allowed = new Set(field.options.map((o) => o.value));
        if (!allowed.has(String(raw))) {
          issues.push({
            field: field.key,
            section,
            message: `${field.label} has an invalid option.`,
          });
        }
      }
    }
  }

  return issues;
}

export function diffPlatformConfig(
  before: PlatformConfigValues,
  after: PlatformConfigValues,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (before[key] !== after[key]) changed.push(key);
  }
  return changed;
}
