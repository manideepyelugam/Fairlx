/**
 * Workitem Notification System
 * 
 * Event-driven notification system with SMTP (email) and WebSocket (real-time) channels.
 * 
 * Architecture:
 * - Event Emitters: Create workitem events from task/comment/attachment actions
 * - Dispatcher: Routes events to recipients via appropriate channels
 * - Channel Handlers: Isolated handlers for socket and email delivery
 * 
 * Usage:
 * ```typescript
 * import { dispatchWorkitemEvent, createAssignedEvent } from "@/lib/notifications";
 * 
 * const event = createAssignedEvent(task, userId, userName, [newAssigneeId]);
 * await dispatchWorkitemEvent(event);
 * ```
 */

// Types (use export type for types to satisfy isolatedModules)
export {
    WorkitemEventType,
    DEFAULT_NOTIFICATION_PREFERENCES,
} from "./types";

export type {
    NotificationChannel,
    WorkitemEvent,
    WorkitemEventMetadata,
    NotificationPayload,
    UserNotificationPreferences,
    ChannelHandler,
    RecipientInfo,
} from "./types";

// Event creators
export {
    createWorkitemEvent,
    createAssignedEvent,
    createStatusChangedEvent,
    createCompletedEvent,
    createPriorityChangedEvent,
    createDueDateChangedEvent,
    createCommentAddedEvent,
    createMentionEvent,
    createAttachmentAddedEvent,
    createAttachmentDeletedEvent,
    getNotificationTitle,
    getNotificationSummary,
    getDefaultChannelsForEvent,
} from "./events";

// Dispatcher
export { dispatcher, dispatchWorkitemEvent } from "./dispatcher";

// Channel handlers
export {
    SocketChannelHandler,
    socketChannelHandler,
    EmailChannelHandler,
    emailChannelHandler,
} from "./channels";

// =============================================================================
// INITIALIZATION
// =============================================================================

import { dispatcher } from "./dispatcher";
import { socketChannelHandler, emailChannelHandler } from "./channels";

// Register channel handlers with dispatcher
dispatcher.registerChannel(socketChannelHandler);
dispatcher.registerChannel(emailChannelHandler);

// console.log("[Notifications] Channel handlers registered: socket, email");
