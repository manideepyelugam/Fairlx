/**
 * Workitem Event Emitter
 * 
 * Helper functions to create and emit workitem events.
 * This is the single source of truth for event creation.
 */

import { Task } from "@/features/tasks/types";
import { WorkitemEvent, WorkitemEventType, WorkitemEventMetadata } from "./types";

// =============================================================================
// EVENT CREATION HELPERS
// =============================================================================

interface CreateEventParams {
    type: WorkitemEventType;
    workitem: Task;
    triggeredBy: string;
    triggeredByName: string;
    metadata?: WorkitemEventMetadata;
}

/**
 * Create a workitem event object
 */
export function createWorkitemEvent({
    type,
    workitem,
    triggeredBy,
    triggeredByName,
    metadata,
}: CreateEventParams): WorkitemEvent {
    return {
        type,
        workitemId: workitem.$id,
        workspaceId: workitem.workspaceId,
        triggeredBy,
        triggeredByName,
        workitem,
        metadata,
    };
}

// =============================================================================
// CONVENIENCE FUNCTIONS FOR COMMON EVENTS
// =============================================================================

export function createAssignedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    addedAssigneeIds: string[]
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_ASSIGNED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { addedAssigneeIds },
    });
}

export function createStatusChangedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    oldStatus: string,
    newStatus: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_STATUS_CHANGED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { oldStatus, newStatus },
    });
}

export function createCompletedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_COMPLETED,
        workitem,
        triggeredBy,
        triggeredByName,
    });
}

export function createPriorityChangedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    oldPriority: string,
    newPriority: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_PRIORITY_CHANGED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { oldPriority, newPriority },
    });
}

export function createDueDateChangedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    oldDueDate: string | undefined,
    newDueDate: string | undefined
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_DUE_DATE_CHANGED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { oldDueDate, newDueDate },
    });
}

export function createCommentAddedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    commentId: string,
    mentionedUserIds?: string[]
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_COMMENT_ADDED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { commentId, mentionedUserIds },
    });
}

export function createMentionEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    mentionedUserId: string,
    snippet: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_MENTION,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: {
            mentionedBy: triggeredBy,
            mentionedUserId,
            snippet: snippet.slice(0, 120),
        },
    });
}

export function createAttachmentAddedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    attachmentId: string,
    attachmentName: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_ATTACHMENT_ADDED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { attachmentId, attachmentName },
    });
}

export function createAttachmentDeletedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    attachmentId: string,
    attachmentName: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_ATTACHMENT_DELETED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { attachmentId, attachmentName },
    });
}

// =============================================================================
// NOTIFICATION TITLE/MESSAGE GENERATORS
// =============================================================================

export function getNotificationTitle(event: WorkitemEvent): string {
    const taskName = event.workitem.title || event.workitem.name || "Untitled Task";

    switch (event.type) {
        case WorkitemEventType.WORKITEM_CREATED:
            return "New Task Created";
        case WorkitemEventType.WORKITEM_ASSIGNED:
            return "Task Assigned to You";
        case WorkitemEventType.WORKITEM_UNASSIGNED:
            return "Task Unassigned";
        case WorkitemEventType.WORKITEM_STATUS_CHANGED:
            return "Task Status Updated";
        case WorkitemEventType.WORKITEM_COMPLETED:
            return "Task Completed";
        case WorkitemEventType.WORKITEM_PRIORITY_CHANGED:
            return "Priority Changed";
        case WorkitemEventType.WORKITEM_DUE_DATE_CHANGED:
            return "Due Date Updated";
        case WorkitemEventType.WORKITEM_DUE_DATE_APPROACHING:
            return `Due Soon: ${taskName}`;
        case WorkitemEventType.WORKITEM_OVERDUE:
            return `⚠️ Overdue: ${taskName}`;
        case WorkitemEventType.WORKITEM_COMMENT_ADDED:
            return "New Comment";
        case WorkitemEventType.WORKITEM_MENTION:
            return "You were mentioned";
        case WorkitemEventType.WORKITEM_ATTACHMENT_ADDED:
            return "Attachment Added";
        case WorkitemEventType.WORKITEM_ATTACHMENT_DELETED:
            return "Attachment Removed";
        default:
            return "Task Updated";
    }
}

export function getNotificationSummary(event: WorkitemEvent): string {
    const taskName = event.workitem.title || event.workitem.name || "Untitled Task";
    const byName = event.triggeredByName;

    switch (event.type) {
        case WorkitemEventType.WORKITEM_CREATED:
            return `${byName} created "${taskName}"`;
        case WorkitemEventType.WORKITEM_ASSIGNED:
            return `${byName} assigned you to "${taskName}"`;
        case WorkitemEventType.WORKITEM_UNASSIGNED:
            return `${byName} removed you from "${taskName}"`;
        case WorkitemEventType.WORKITEM_STATUS_CHANGED:
            return `${byName} changed status of "${taskName}" to ${event.metadata?.newStatus || "unknown"}`;
        case WorkitemEventType.WORKITEM_COMPLETED:
            return `${byName} marked "${taskName}" as completed`;
        case WorkitemEventType.WORKITEM_PRIORITY_CHANGED:
            return `${byName} changed priority of "${taskName}" to ${event.metadata?.newPriority || "unknown"}`;
        case WorkitemEventType.WORKITEM_DUE_DATE_CHANGED:
            return `${byName} updated the due date for "${taskName}"`;
        case WorkitemEventType.WORKITEM_DUE_DATE_APPROACHING:
            return `"${taskName}" is due soon`;
        case WorkitemEventType.WORKITEM_OVERDUE:
            return `"${taskName}" is overdue`;
        case WorkitemEventType.WORKITEM_COMMENT_ADDED:
            return `${byName} commented on "${taskName}"`;
        case WorkitemEventType.WORKITEM_MENTION:
            return `${byName} mentioned you in "${taskName}"`;
        case WorkitemEventType.WORKITEM_ATTACHMENT_ADDED:
            return `${byName} added an attachment to "${taskName}"`;
        case WorkitemEventType.WORKITEM_ATTACHMENT_DELETED:
            return `${byName} removed an attachment from "${taskName}"`;
        default:
            return `${byName} updated "${taskName}"`;
    }
}

// =============================================================================
// CHANNEL DETERMINATION
// =============================================================================

/**
 * Determine which channels should be used for a given event type
 * This is the baseline before user preferences are applied
 */
export function getDefaultChannelsForEvent(event: WorkitemEvent): ("socket" | "email")[] {
    const channels: ("socket" | "email")[] = ["socket"]; // Always include socket

    // Most workitem events should trigger email notifications
    switch (event.type) {
        // High-priority events - always email
        case WorkitemEventType.WORKITEM_ASSIGNED:
        case WorkitemEventType.WORKITEM_COMPLETED:
        case WorkitemEventType.WORKITEM_OVERDUE:
        case WorkitemEventType.WORKITEM_DUE_DATE_APPROACHING:
        case WorkitemEventType.WORKITEM_STATUS_CHANGED:
        case WorkitemEventType.WORKITEM_PRIORITY_CHANGED:
        case WorkitemEventType.WORKITEM_DUE_DATE_CHANGED:
        case WorkitemEventType.WORKITEM_UPDATED:
        case WorkitemEventType.WORKITEM_COMMENT_ADDED:
        case WorkitemEventType.WORKITEM_MENTION:
            channels.push("email");
            break;

        // Attachments - email notification
        case WorkitemEventType.WORKITEM_ATTACHMENT_ADDED:
        case WorkitemEventType.WORKITEM_ATTACHMENT_DELETED:
            channels.push("email");
            break;

        // Created, deleted, unassigned - email notification
        case WorkitemEventType.WORKITEM_CREATED:
        case WorkitemEventType.WORKITEM_DELETED:
        case WorkitemEventType.WORKITEM_UNASSIGNED:
            channels.push("email");
            break;
    }

    return channels;
}
