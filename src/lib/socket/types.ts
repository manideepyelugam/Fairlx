/**
 * Socket Push Notification Types
 * 
 * Lightweight payload types for WebSocket push notifications.
 */

export interface SocketNotificationPayload {
    /** Notification ID from database */
    notificationId: string;
    /** Notification type (e.g., "task_assigned", "task_updated") */
    type: string;
    /** Notification title */
    title: string;
    /** Notification message */
    message: string;
    /** Workitem/Task ID (if applicable) */
    workitemId?: string;
    /** Workspace ID */
    workspaceId: string;
    /** Timestamp when notification was created */
    createdAt: string;
    /** User who triggered the notification */
    triggeredBy?: string;
}

export interface SocketAuthPayload {
    /** User ID for room assignment */
    userId: string;
    /** Session token for authentication */
    sessionToken?: string;
}

export interface SocketEventMap {
    /** New notification event */
    "notification:new": SocketNotificationPayload;
    /** Authentication event */
    "auth:connect": SocketAuthPayload;
    /** Authentication success */
    "auth:success": { userId: string; connectedAt: string };
    /** Authentication failure */
    "auth:error": { message: string };
}
