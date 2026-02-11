/**
 * Workitem Notification System - Types
 * 
 * Core type definitions for the event-driven notification system.
 */

import { Task } from "@/features/tasks/types";

// =============================================================================
// WORKITEM EVENT TYPES
// =============================================================================

export enum WorkitemEventType {
    // Core lifecycle events
    WORKITEM_CREATED = "WORKITEM_CREATED",
    WORKITEM_ASSIGNED = "WORKITEM_ASSIGNED",
    WORKITEM_UNASSIGNED = "WORKITEM_UNASSIGNED",
    WORKITEM_STATUS_CHANGED = "WORKITEM_STATUS_CHANGED",
    WORKITEM_COMPLETED = "WORKITEM_COMPLETED",
    WORKITEM_DELETED = "WORKITEM_DELETED",

    // Update events
    WORKITEM_UPDATED = "WORKITEM_UPDATED",
    WORKITEM_PRIORITY_CHANGED = "WORKITEM_PRIORITY_CHANGED",
    WORKITEM_DUE_DATE_CHANGED = "WORKITEM_DUE_DATE_CHANGED",

    // Time-based events
    WORKITEM_DUE_DATE_APPROACHING = "WORKITEM_DUE_DATE_APPROACHING",
    WORKITEM_OVERDUE = "WORKITEM_OVERDUE",

    // Related entity events
    WORKITEM_COMMENT_ADDED = "WORKITEM_COMMENT_ADDED",
    WORKITEM_MENTION = "WORKITEM_MENTION",
    WORKITEM_REPLY = "WORKITEM_REPLY",
    WORKITEM_ATTACHMENT_ADDED = "WORKITEM_ATTACHMENT_ADDED",
    WORKITEM_ATTACHMENT_DELETED = "WORKITEM_ATTACHMENT_DELETED",

    // Workspace events
    WORKSPACE_MEMBER_ADDED = "WORKSPACE_MEMBER_ADDED",
    WORKSPACE_MEMBER_REMOVED = "WORKSPACE_MEMBER_REMOVED",
    WORKSPACE_ROLE_CHANGED = "WORKSPACE_ROLE_CHANGED",
}

// =============================================================================
// NOTIFICATION CHANNEL TYPES
// =============================================================================

export type NotificationChannel = "socket" | "email";

// =============================================================================
// EVENT PAYLOAD
// =============================================================================

export interface WorkitemEvent {
    /** Event type */
    type: WorkitemEventType;
    /** Workitem ID */
    workitemId: string;
    /** Workspace ID */
    workspaceId: string;
    /** User ID who triggered the event */
    triggeredBy: string;
    /** Display name of the triggering user */
    triggeredByName: string;
    /** The workitem data */
    workitem: Task;
    /** Optional metadata for specific event types */
    metadata?: WorkitemEventMetadata;
}

export interface WorkitemEventMetadata {
    // Status change
    oldStatus?: string;
    newStatus?: string;

    // Priority change
    oldPriority?: string;
    newPriority?: string;

    // Due date change
    oldDueDate?: string;
    newDueDate?: string;

    // Assignment change
    addedAssigneeIds?: string[];
    removedAssigneeIds?: string[];

    // Comment
    commentId?: string;
    commentContent?: string;
    mentionedUserIds?: string[];
    isMentioned?: boolean;

    // Reply
    parentCommentId?: string;
    parentCommentAuthorId?: string;
    parentCommentAuthorName?: string;
    replyContent?: string;

    // Mention
    mentionedBy?: string;
    mentionedUserId?: string;
    snippet?: string;

    // Attachment
    attachmentId?: string;
    attachmentName?: string;

    // Generic changes description
    changesDescription?: string;

    // Recipient overrides
    excludeUserIds?: string[];

    // Extensible
    [key: string]: unknown;
}

// =============================================================================
// NOTIFICATION PAYLOAD (for delivery)
// =============================================================================

export interface NotificationPayload {
    /** Unique notification ID */
    id: string;
    /** Event type that triggered this notification */
    type: WorkitemEventType;
    /** Workitem ID */
    workitemId: string;
    /** Workspace ID */
    workspaceId: string;
    /** Notification title */
    title: string;
    /** Notification summary/message */
    summary: string;
    /** User ID who triggered the event */
    triggeredBy: string;
    /** Display name of the triggering user */
    triggeredByName: string;
    /** Timestamp of the notification */
    timestamp: string;
    /** Deep link URL to the workitem */
    deepLinkUrl: string;
    /** Optional metadata */
    metadata?: WorkitemEventMetadata;
}

// =============================================================================
// USER PREFERENCES
// =============================================================================

export interface UserNotificationPreferences {
    /** Enable/disable email notifications (default: true) */
    emailNotifications: boolean;
    /** Enable/disable push/socket notifications (default: true) */
    pushNotifications: boolean;
    /** List of muted workitem IDs */
    mutedWorkitems: string[];
    /** List of muted project IDs */
    mutedProjects: string[];
    /** Suppress notifications for own actions (default: true) */
    selfActionSuppression: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: UserNotificationPreferences = {
    emailNotifications: true,
    pushNotifications: true,
    mutedWorkitems: [],
    mutedProjects: [],
    selfActionSuppression: true,
};

// =============================================================================
// CHANNEL HANDLER INTERFACE
// =============================================================================

export interface ChannelHandler {
    /** Channel name */
    readonly name: NotificationChannel;

    /**
     * Send notification to a user
     * @param userId - Target user ID
     * @param payload - Notification payload
     * @returns Promise that resolves when sent (or rejects on error)
     */
    send(userId: string, payload: NotificationPayload): Promise<void>;
}

// =============================================================================
// RECIPIENT INFO
// =============================================================================

export interface RecipientInfo {
    userId: string;
    memberId?: string;
    channels: NotificationChannel[];
}
