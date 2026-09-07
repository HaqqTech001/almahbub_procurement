/** Inbox contracts aligned with `apps/api` notification domain. */

export const NOTIFICATION_TYPES = [
  "account",
  "procurement",
  "quotation",
  "invoice",
  "payment",
  "shipment",
  "announcement",
  "support",
  "system",
  "security",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_PRIORITIES = [
  "critical",
  "high",
  "normal",
  "low",
] as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export const NOTIFICATION_STATUSES = [
  "unread",
  "read",
  "archived",
  "dismissed",
  "expired",
  "scheduled",
] as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** Prisma / API notification channels. */
export const NOTIFICATION_CHANNELS = [
  "in_app",
  "email",
  "sms",
  "push",
] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type NotificationChannelAvailability =
  | "active"
  | "placeholder"
  | "future";

export type NotificationChannelDescriptor = {
  id: NotificationChannel;
  label: string;
  description: string;
  availability: NotificationChannelAvailability;
};

export const NOTIFICATION_CHANNEL_DESCRIPTORS: NotificationChannelDescriptor[] =
  [
    {
      id: "in_app",
      label: "In-app",
      description: "Inbox center with realtime updates",
      availability: "active",
    },
    {
      id: "email",
      label: "Email",
      description: "Transactional email via organization gateway",
      availability: "active",
    },
    {
      id: "sms",
      label: "SMS",
      description: "SMS delivery placeholder - provider not wired",
      availability: "placeholder",
    },
    {
      id: "push",
      label: "Push",
      description: "Mobile / web push placeholder - provider not wired",
      availability: "placeholder",
    },
  ];

export type NotificationPreference = {
  type: string;
  channel: NotificationChannel | string;
  enabled: boolean;
  locale?: string | undefined;
};

/**
 * Mission-facing categories - map to API `type` + optional `kind` metadata.
 * Hosts may set `kind` when projecting events into the inbox.
 */
export type NotificationKind =
  | "procurement_update"
  | "quotation_received"
  | "order_approved"
  | "shipment_update"
  | "invoice_generated"
  | "payment_received"
  | "system_announcement"
  | "message"
  | "mention"
  | "ai_recommendation"
  | "other";

export type InboxNotification = {
  id: string;
  type: NotificationType | string;
  priority: NotificationPriority | string;
  status: NotificationStatus | string;
  title: string;
  body: string;
  deepLink?: string | null | undefined;
  createdAt: string;
  readAt?: string | null | undefined;
  archivedAt?: string | null | undefined;
  dismissedAt?: string | null | undefined;
  expiresAt?: string | null | undefined;
  /** When set in the future (and status scheduled), held until deliver-at. */
  scheduledFor?: string | null | undefined;
  locale?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  /** Client-only pin; persist via onPinChange. */
  pinned?: boolean | undefined;
  /** Finer category for grouping labels. */
  kind?: NotificationKind | undefined;
  /** Delivery channels for this notification (defaults to in_app). */
  channels?: Array<NotificationChannel | string> | undefined;
  /** Primary channel badge when multiple channels were attempted. */
  primaryChannel?: NotificationChannel | string | undefined;
};

export type NotificationFilterState = {
  query: string;
  types: string[];
  priorities: string[];
  status:
    | "all"
    | "unread"
    | "read"
    | "archived"
    | "pinned"
    | "scheduled"
    | "dismissed";
  kinds: string[];
  channels: string[];
};

export type NotificationGroupId =
  | "pinned"
  | "scheduled"
  | "today"
  | "yesterday"
  | "earlier"
  | "archived"
  | "dismissed";

export type NotificationGroup = {
  id: NotificationGroupId;
  label: string;
  items: InboxNotification[];
};

export const emptyNotificationFilters = (): NotificationFilterState => ({
  query: "",
  types: [],
  priorities: [],
  status: "all",
  kinds: [],
  channels: [],
});

export function notificationChannelLabel(channel: string): string {
  const found = NOTIFICATION_CHANNEL_DESCRIPTORS.find((c) => c.id === channel);
  if (found) return found.label;
  return channel.replaceAll("_", " ");
}

export function notificationChannelAvailability(
  channel: string,
): NotificationChannelAvailability {
  return (
    NOTIFICATION_CHANNEL_DESCRIPTORS.find((c) => c.id === channel)
      ?.availability ?? "placeholder"
  );
}

export function resolveNotificationChannels(
  item: Pick<InboxNotification, "channels" | "primaryChannel">,
): string[] {
  if (item.channels?.length) return item.channels.map(String);
  if (item.primaryChannel) return [String(item.primaryChannel)];
  return ["in_app"];
}

/** Mission types highlighted in Notification Settings. */
export const NOTIFICATION_SETTINGS_TYPES = [
  "procurement",
  "quotation",
  "shipment",
  "invoice",
  "payment",
  "system",
  "announcement",
  "security",
] as const;

export function notificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    account: "Account",
    procurement: "Procurement",
    quotation: "Quotations",
    invoice: "Invoices",
    payment: "Payments",
    shipment: "Shipments",
    announcement: "Announcements",
    support: "Messages",
    system: "System",
    security: "Security",
  };
  return labels[type] ?? type.replace(/_/g, " ");
}

export function notificationKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    procurement_update: "Procurement updates",
    quotation_received: "Quotation received",
    order_approved: "Order approved",
    shipment_update: "Shipment updates",
    invoice_generated: "Invoice generated",
    payment_received: "Payment received",
    system_announcement: "System announcements",
    message: "Messages",
    mention: "Mentions",
    ai_recommendation: "AI recommendations",
    other: "Other",
  };
  return labels[kind] ?? kind.replace(/_/g, " ");
}

export function resolveNotificationKind(
  item: Pick<InboxNotification, "type" | "kind" | "metadata" | "title">,
): NotificationKind {
  if (item.kind) return item.kind;
  const metaKind = item.metadata?.kind;
  if (typeof metaKind === "string" && metaKind in {
    procurement_update: 1,
    quotation_received: 1,
    order_approved: 1,
    shipment_update: 1,
    invoice_generated: 1,
    payment_received: 1,
    system_announcement: 1,
    message: 1,
    mention: 1,
    ai_recommendation: 1,
  }) {
    return metaKind as NotificationKind;
  }
  switch (item.type) {
    case "procurement":
      return /approv/i.test(item.title) ? "order_approved" : "procurement_update";
    case "quotation":
      return "quotation_received";
    case "shipment":
      return "shipment_update";
    case "invoice":
      return "invoice_generated";
    case "payment":
      return "payment_received";
    case "announcement":
      return "system_announcement";
    case "support":
      return /mention/i.test(item.title) ? "mention" : "message";
    case "system":
      return /ai|recommend/i.test(item.title)
        ? "ai_recommendation"
        : "system_announcement";
    case "security":
      return "system_announcement";
    default:
      return "other";
  }
}

export function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function isNotificationScheduled(
  item: Pick<InboxNotification, "status" | "scheduledFor">,
  now = Date.now(),
): boolean {
  if (item.status === "scheduled") return true;
  if (!item.scheduledFor) return false;
  return Date.parse(item.scheduledFor) > now;
}

export function groupNotifications(
  items: InboxNotification[],
  now = new Date(),
): NotificationGroup[] {
  const today = startOfDay(now);
  const yesterday = today - 86_400_000;
  const nowMs = now.getTime();
  const pinned: InboxNotification[] = [];
  const scheduled: InboxNotification[] = [];
  const todayItems: InboxNotification[] = [];
  const yesterdayItems: InboxNotification[] = [];
  const earlier: InboxNotification[] = [];
  const archived: InboxNotification[] = [];
  const dismissed: InboxNotification[] = [];

  for (const item of items) {
    if (item.status === "dismissed") {
      dismissed.push(item);
      continue;
    }
    if (item.status === "archived") {
      archived.push(item);
      continue;
    }
    if (isNotificationScheduled(item, nowMs)) {
      scheduled.push(item);
      continue;
    }
    if (item.pinned) {
      pinned.push(item);
      continue;
    }
    const t = new Date(item.createdAt).getTime();
    if (t >= today) todayItems.push(item);
    else if (t >= yesterday) yesterdayItems.push(item);
    else earlier.push(item);
  }

  const groups: NotificationGroup[] = [];
  if (pinned.length) groups.push({ id: "pinned", label: "Pinned", items: pinned });
  if (scheduled.length) {
    groups.push({ id: "scheduled", label: "Scheduled", items: scheduled });
  }
  if (todayItems.length) groups.push({ id: "today", label: "Today", items: todayItems });
  if (yesterdayItems.length) {
    groups.push({ id: "yesterday", label: "Yesterday", items: yesterdayItems });
  }
  if (earlier.length) groups.push({ id: "earlier", label: "Earlier", items: earlier });
  if (archived.length) {
    groups.push({ id: "archived", label: "Archived", items: archived });
  }
  if (dismissed.length) {
    groups.push({ id: "dismissed", label: "Dismissed", items: dismissed });
  }
  return groups;
}

export function filterNotifications(
  items: InboxNotification[],
  filters: NotificationFilterState,
  now = Date.now(),
): InboxNotification[] {
  const q = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.status === "unread" && item.status !== "unread") return false;
    if (filters.status === "read" && item.status !== "read") return false;
    if (filters.status === "archived" && item.status !== "archived") return false;
    if (filters.status === "dismissed" && item.status !== "dismissed") {
      return false;
    }
    if (filters.status === "pinned" && !item.pinned) return false;
    if (filters.status === "scheduled" && !isNotificationScheduled(item, now)) {
      return false;
    }
    if (
      filters.status === "all" &&
      (item.status === "archived" || item.status === "dismissed")
    ) {
      return false;
    }
    if (filters.types.length && !filters.types.includes(String(item.type))) {
      return false;
    }
    if (
      filters.priorities.length &&
      !filters.priorities.includes(String(item.priority))
    ) {
      return false;
    }
    const kind = resolveNotificationKind(item);
    if (filters.kinds.length && !filters.kinds.includes(kind)) return false;
    const channels = resolveNotificationChannels(item);
    if (
      filters.channels.length &&
      !filters.channels.some((c) => channels.includes(c))
    ) {
      return false;
    }
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.body.toLowerCase().includes(q) ||
      notificationTypeLabel(String(item.type)).toLowerCase().includes(q) ||
      notificationKindLabel(kind).toLowerCase().includes(q) ||
      channels.some((c) =>
        notificationChannelLabel(c).toLowerCase().includes(q),
      )
    );
  });
}
