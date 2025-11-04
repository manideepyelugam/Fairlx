// Components
export { NotificationBell } from "./components/notification-bell";
export { NotificationItem } from "./components/notification-item";

// API Hooks
export { useGetNotifications } from "./api/use-get-notifications";
export { useGetUnreadCount } from "./api/use-get-unread-count";
export { useMarkNotificationRead } from "./api/use-mark-notification-read";
export { useMarkAllNotificationsRead } from "./api/use-mark-all-notifications-read";
export { useDeleteNotification } from "./api/use-delete-notification";

// Types
export type {
  Notification,
  PopulatedNotification,
  CreateNotificationDto,
  NotificationMetadata,
} from "./types";
export { NotificationType } from "./types";

// Schemas
export {
  createNotificationSchema,
  markNotificationReadSchema,
  markAllNotificationsReadSchema,
  getNotificationsSchema,
  deleteNotificationSchema,
} from "./schemas";
