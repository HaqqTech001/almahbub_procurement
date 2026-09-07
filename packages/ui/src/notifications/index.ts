export type * from "./types.js";
export {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_DESCRIPTORS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_SETTINGS_TYPES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  emptyNotificationFilters,
  filterNotifications,
  groupNotifications,
  isNotificationScheduled,
  notificationChannelAvailability,
  notificationChannelLabel,
  notificationKindLabel,
  notificationTypeLabel,
  resolveNotificationChannels,
  resolveNotificationKind,
  startOfDay,
} from "./types.js";
export {
  NotificationCenter,
  NotificationCenterSkeleton,
} from "./NotificationCenter.js";
export type {
  NotificationCenterProps,
  NotificationCenterView,
} from "./NotificationCenter.js";

/** Mission alias - same presentational engine as NotificationCenter. */
export {
  NotificationCenter as NotificationEngine,
  NotificationCenterSkeleton as NotificationEngineSkeleton,
} from "./NotificationCenter.js";
export type {
  NotificationCenterProps as NotificationEngineProps,
} from "./NotificationCenter.js";
export { BellIcon } from "./BellIcon.js";
export { resolveNotificationHref } from "./resolve-notification-href.js";
export type {
  NotificationHrefAudience,
  NotificationHrefSource,
} from "./resolve-notification-href.js";
export { NotificationDetailView } from "./NotificationDetailView.js";
export type { NotificationDetailViewProps } from "./NotificationDetailView.js";
export {
  useNotificationInbox,
  useNotificationRealtime,
} from "./useNotificationInbox.js";
export type { NotificationRealtimeEvent } from "./useNotificationInbox.js";
export {
  notificationCenterFixture,
  notificationPreferencesFixture,
} from "./fixtures.js";

export const notificationsLazy = {
  NotificationCenter: () => import("./NotificationCenter.js"),
} as const;
