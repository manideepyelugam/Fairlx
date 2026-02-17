/**
 * Workitem Event Emitter
 *
 * Helper functions to create and emit workitem events.
 * This is the single source of truth for event creation.
 */

import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
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

export function createTaskCreatedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_CREATED,
        workitem,
        triggeredBy,
        triggeredByName,
    });
}

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

export function createDeletedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_DELETED,
        workitem,
        triggeredBy,
        triggeredByName,
    });
}

export function createUnassignedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    removedAssigneeIds: string[]
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_UNASSIGNED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { removedAssigneeIds },
    });
}

export function createTaskUpdatedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    changesDescription?: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_UPDATED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { changesDescription },
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

export function createProjectUpdatedEvent(
    project: Project,
    triggeredBy: string,
    triggeredByName: string,
    changesDescription?: string
): WorkitemEvent {
    // We wrap the project in a Task-like structure for the dispatcher
    // The WebhookChannelHandler will map it back to PROJECT_UPDATED
    return createWorkitemEvent({
        type: WorkitemEventType.PROJECT_UPDATED,
        workitem: {
            ...project,
            projectId: project.$id, // Use own ID as projectId for broadcast
            title: project.name, // Use project name as title
        } as unknown as Task,
        triggeredBy,
        triggeredByName,
        metadata: { changesDescription },
    });
}

export function createMemberAddedEvent(
    workspaceId: string,
    workspaceName: string,
    triggeredBy: string,
    triggeredByName: string,
    addedUserId: string,
    addedUserName: string,
    role: string
): WorkitemEvent {
    // Workaround: Mock task object for workspace events
    const mockTask = {
        $id: "workspace-event",
        workspaceId,
        projectId: "", // Workspace events don't have a single project
        title: `Workspace: ${workspaceName}`,
        name: `Workspace: ${workspaceName}`,
    } as Task;

    return createWorkitemEvent({
        type: WorkitemEventType.WORKSPACE_MEMBER_ADDED,
        workitem: mockTask,
        triggeredBy,
        triggeredByName,
        metadata: {
            addedUserId,
            addedUserName,
            newRole: role,
        },
    });
}

export function createMemberRemovedEvent(
    workspaceId: string,
    workspaceName: string,
    triggeredBy: string,
    triggeredByName: string,
    removedUserId: string,
    removedUserName: string
): WorkitemEvent {
    const mockTask = {
        $id: "workspace-event",
        workspaceId,
        projectId: "", // Workspace events don't have a single project
        title: `Workspace: ${workspaceName}`,
        name: `Workspace: ${workspaceName}`,
    } as Task;

    return createWorkitemEvent({
        type: WorkitemEventType.WORKSPACE_MEMBER_REMOVED,
        workitem: mockTask,
        triggeredBy,
        triggeredByName,
        metadata: {
            removedUserId,
            removedUserName,
        },
    });
}

export function createCommentAddedEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    commentId: string,
    mentionedUserIds?: string[],
    commentContent?: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_COMMENT_ADDED,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: { commentId, mentionedUserIds, commentContent },
    });
}

export function createReplyEvent(
    workitem: Task,
    triggeredBy: string,
    triggeredByName: string,
    commentId: string,
    parentCommentAuthorId: string,
    parentCommentAuthorName: string,
    replyContent?: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.WORKITEM_REPLY,
        workitem,
        triggeredBy,
        triggeredByName,
        metadata: {
            commentId,
            parentCommentAuthorId,
            parentCommentAuthorName,
            replyContent,
            commentContent: replyContent,
        },
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
            commentContent: snippet.slice(0, 200),
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
        case WorkitemEventType.WORKITEM_REPLY:
            return "New Reply";
        case WorkitemEventType.WORKITEM_ATTACHMENT_ADDED:
            return "Attachment Added";
        case WorkitemEventType.WORKITEM_ATTACHMENT_DELETED:
            return "Attachment Removed";
        case WorkitemEventType.WORKITEM_UPDATED:
            return "Task Updated";
        default:
            return "Notification";
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
        case WorkitemEventType.WORKITEM_REPLY:
            return `${byName} replied to your comment on "${taskName}"`;
        case WorkitemEventType.WORKITEM_ATTACHMENT_ADDED:
            return `${byName} added an attachment to "${taskName}"`;
        case WorkitemEventType.WORKITEM_ATTACHMENT_DELETED:
            return `${byName} removed an attachment from "${taskName}"`;
        default:
            return `${byName} updated "${taskName}"`;
    }
}

// =============================================================================
// SUBSCRIBER RESOLUTION HELPERS
// =============================================================================

/**
 * Event types that should notify everyone assigned to the task
 */
export const EVENTS_NOTIFYING_ALL_ASSIGNEES: WorkitemEventType[] = [
    WorkitemEventType.WORKITEM_ASSIGNED,
    WorkitemEventType.WORKITEM_STATUS_CHANGED,
    WorkitemEventType.WORKITEM_COMPLETED,
    WorkitemEventType.WORKITEM_PRIORITY_CHANGED,
    WorkitemEventType.WORKITEM_DUE_DATE_CHANGED,
    WorkitemEventType.WORKITEM_COMMENT_ADDED, // For regular comments
    WorkitemEventType.WORKITEM_ATTACHMENT_ADDED,
    WorkitemEventType.WORKITEM_ATTACHMENT_DELETED,
    WorkitemEventType.WORKITEM_UPDATED,
];

/**
 * Event types that should notify the task reporter
 */
export const EVENTS_NOTIFYING_REPORTER: WorkitemEventType[] = [
    WorkitemEventType.WORKITEM_STATUS_CHANGED,
    WorkitemEventType.WORKITEM_COMPLETED,
    WorkitemEventType.WORKITEM_OVERDUE,
];

// =============================================================================
// CHANNEL DETERMINATION
// =============================================================================

import { NotificationChannel } from "./types";

/**
 * Determine which channels should be used for a given event type
 * This is the baseline before user preferences are applied
 */
export function getDefaultChannelsForEvent(_event: WorkitemEvent): NotificationChannel[] {
    const channels: NotificationChannel[] = ["socket"]; // Always include socket

    // For now, always include email for workitem events to ensure delivery
    channels.push("email");

    // Include webhook channel for all project-level events
    channels.push("webhook");

    return channels;
}

export function createProjectMemberAddedEvent(
    project: Project,
    triggeredBy: string,
    triggeredByName: string,
    addedUserId: string,
    addedUserName: string,
    roleName: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.PROJECT_MEMBER_ADDED,
        workitem: {
            ...project,
            projectId: project.$id,
            title: project.name,
        } as unknown as Task,
        triggeredBy,
        triggeredByName,
        metadata: {
            addedUserId,
            addedUserName,
            newRole: roleName,
        },
    });
}

export function createProjectMemberRemovedEvent(
    project: Project,
    triggeredBy: string,
    triggeredByName: string,
    removedUserId: string,
    removedUserName: string
): WorkitemEvent {
    return createWorkitemEvent({
        type: WorkitemEventType.PROJECT_MEMBER_REMOVED,
        workitem: {
            ...project,
            projectId: project.$id,
            title: project.name,
        } as unknown as Task,
        triggeredBy,
        triggeredByName,
        metadata: {
            removedUserId,
            removedUserName,
        },
    });
}
